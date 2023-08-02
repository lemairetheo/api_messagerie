const admin = require("firebase-admin");
module.exports = function(app, db) {
    app.get("/" , ( req , res ) => {
        res.send("Hello World !");
    });

    app.post('/change_name', async (req, res) => {
        const new_name = req.body.new_name;
        const id_conv = req.body.id_conv;

        try {
            await db.collection('conversations').doc(id_conv).update({
                name: new_name
            });
            res.status(200).json({ message: 'Le nom de la conversation a été mis à jour avec succès' });
        } catch (error) {
            console.error("Erreur lors de la mise à jour du nom de la conversation : ", error);
            res.status(500).json({ error: error.toString() });
        }
    });


    app.post('/new_conversations', async (req, res) => {
        var participantIds = req.body.participantIds;
        var creator = req.body.creator;

        // Récupérer les noms des participants
        let participantNames = [];
        for (let participantId of participantIds) {
            let doc = await db.collection('users').doc(participantId).get();
            if (!doc.exists) {
                console.log('Aucun utilisateur correspondant à cet ID : ', participantId);
            } else {
                if (doc.id === creator)
                    participantNames.push("vous");
                else
                    participantNames.push(doc.data().username);
            }
        }

        let conversationName = participantNames.join(', ');

        var newConversation = {
            participantIds: participantIds,
            name: conversationName,
            lastMessageTimestamp: new Date()
        };

        try {
            let conversationRef = await db.collection('conversations').add(newConversation);

            for (let participantId of participantIds) {
                await db.collection('users').doc(participantId).update({
                    conversations: admin.firestore.FieldValue.arrayUnion(conversationRef.id)
                });
            }

            res.json({
                message: "Conversation created with ID: " + conversationRef.id
            });
        } catch (error) {
            console.error("Error adding conversation: ", error);
            res.status(500).send(error);
        }
    });


    app.post('/conversations/:conversationId/messages', async (req, res) => {
        var conversationId = req.params.conversationId;
        var userId = req.body.userId;
        var content = req.body.content;

        var newMessage = {
            userId: userId,
            content: content,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        try {
            let docRef = await db.collection('conversations').doc(conversationId).collection('messages').add(newMessage);

            await db.collection('conversations').doc(conversationId).update({
                lastMessageTimestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            res.json({
                message: "Message sent with ID: " + docRef.id
            });
        } catch (error) {
            console.error("Error sending message: ", error);
            res.status(500).send(error);
        }
    });


    app.get('/user_conversations/:userId', async (req, res) => {
        const userId = req.params.userId;

        const conversationsRef = db.collection('conversations');
        let userConversations = [];

        // Obtenir tous les documents de la collection "conversations"
        const snapshot = await conversationsRef.get();

        if (snapshot.empty) {
            console.log('Aucune conversation trouvée. sdfgh');
            res.status(404).send('Aucune conversation trouvée.');
            return;
        }

        snapshot.forEach(doc => {
            const conversation = doc.data();
            // Vérifie si l'ID de l'utilisateur est présent dans la liste des participants à la conversation
            if (conversation.participantIds.includes(userId)) {
                userConversations.push({ ...conversation, id: doc.id });
            }
        });

        res.send(userConversations);
    });




    app.get('/conversations/:conversationId/messages', (req, res) => {
        var conversationId = req.params.conversationId;

        db.collection('conversations').doc(conversationId).collection('messages').orderBy('timestamp', 'asc').get()
            .then((querySnapshot) => {
                var messages = [];
                querySnapshot.forEach((doc) => {
                    let message = doc.data();
                    message.id = doc.id;  // Ajout de l'ID du message
                    messages.push(message);
                });
                res.json(messages);
            })
            .catch((error) => {
                console.error("Error getting messages: ", error);
                res.status(500).send(error);
            });
    });

}