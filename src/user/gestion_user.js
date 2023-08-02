const admin = require("firebase-admin");
module.exports = function(app, db) {
    app.get("/", (req, res) => {
        res.send("Hello World !");
    });

    app.post('/users', (req, res) => {
        var newUserData = {
            username: req.body.username,
            password: req.body.password,  // Veillez à hacher le mot de passe dans la pratique
            conversations: []
        };

        db.collection('users').add(newUserData)
            .then((docRef) => {
                console.log('New user created with ID: ', docRef.id);
                res.status(200).json({id: docRef.id});
            })
            .catch((error) => {
                console.error('Error creating new user: ', error);
                res.status(500).send(error);
            });
    });

    app.post('/login', (req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        const usersRef = db.collection('users');
        usersRef.where('username', '==', username).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log('Aucun utilisateur correspondant.');
                    res.status(404).send('Aucun utilisateur correspondant.');
                    return;
                }

                let userFound = false;
                snapshot.forEach(doc => {
                    const user = doc.data();
                    if (user.password === password) {
                        userFound = true;
                        res.send({ userId: doc.id });
                        return;
                    }
                });

                if (!userFound) {
                    console.log('Mot de passe incorrect.');
                    res.status(403).send('Mot de passe incorrect.');
                }
            })
            .catch(err => {
                console.log('Erreur en recherchant l\'utilisateur', err);
                res.status(500).send('Erreur en recherchant l\'utilisateur');
            });
    });

    app.post('/users/:userId/conversations', (req, res) => {
        var userId = req.params.userId;
        var conversationId = req.body.conversationId;

        db.collection('users').doc(userId).update({
            conversations: admin.firestore.FieldValue.arrayUnion(conversationId)
        })
            .then(() => {
                console.log('Conversation added to user: ', userId);
                res.status(200).json({message: 'Conversation added to user.'});
            })
            .catch((error) => {
                console.error('Error adding conversation to user: ', error);
                res.status(500).send(error);
            });
    });

    app.get('/users/:userId', (req, res) => {
        var userId = req.params.userId;

        db.collection('users').doc(userId).get()
            .then((doc) => {
                if (doc.exists) {
                    res.json({
                        username: doc.data().username
                    });
                } else {
                    res.status(404).send("User not found");
                }
            })
            .catch((error) => {
                console.error("Error getting user: ", error);
                res.status(500).send(error);
            });
    });

    app.post('/users/login', (req, res) => {
        const { username, password } = req.body;

        const docRef = db.collection('users').doc(username);

        docRef.get().then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                // Vérifiez que le mot de passe est correct
                if (userData.password === password) {
                    res.json({ userId: doc.id });
                } else {
                    res.status(401).json({ message: "Incorrect password" });
                }
            } else {
                res.status(404).json({ message: "User not found" });
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
            res.status(500).send(error);
        });
    });

}