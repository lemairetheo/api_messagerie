var admin = require("firebase-admin");
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');

var app = express()

app.use(cors({ origin: 'http://localhost:5173' }));

app.use(bodyParser.json())

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.listen(3000, function () {
    console.log('App listening on port 3000!');
});

var serviceAccount = require("../firebase-key.json"); // Assurez-vous que le chemin du fichier est correct


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://messagerie-instantanee-baa7b.firebaseio.com"
});

var db = admin.firestore();


//////////////////////////////////// request ////////////////////////////////////////////

require("./conversation/gestion_con")(app, db)
require("./user/gestion_user")(app, db)






/////////////////////////////////////////////////////////////////////////////////////////


/*var newMessage = {
    userId: "user1",
    messageContent: "Hello, world!",
    timestamp: admin.firestore.FieldValue.serverTimestamp()
};

db.collection("messages").add(newMessage)
    .then((docRef) => {
        console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
        console.error("Error adding document: ", error);
    });
*/

function createConversation(participantIds) {
    var db = admin.firestore();

    var newConversation = {
        participantIds: participantIds
    };

    db.collection('conversations').add(newConversation)
        .then((docRef) => {
            console.log("Conversation created with ID: ", docRef.id);
        })
        .catch((error) => {
            console.error("Error adding conversation: ", error);
        });
}

// Utilisation
//createConversation(["user1", "user2"]);

function sendMessage(conversationId, userId, content) {
    var db = admin.firestore();

    var newMessage = {
        userId: userId,
        content: content,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    db.collection('conversations').doc(conversationId).collection('messages').add(newMessage)
        .then((docRef) => {
            console.log("Message sent with ID: ", docRef.id);
        })
        .catch((error) => {
            console.error("Error sending message: ", error);
        });
}

function readMessages(conversationId) {
    var db = admin.firestore();

    db.collection('conversations').doc(conversationId).collection('messages').orderBy('timestamp').get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                console.log(doc.id, '=>', doc.data());
            });
        })
        .catch((error) => {
            console.error("Error getting messages: ", error);
        });
}

readMessages("vCDHMrucGI4zDL1xiTuC")

function getMessagesByUserId(userId) {
    var db = admin.firestore();

    db.collection('messages')
        .where('userId', '==', userId)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                console.log(doc.id, '=>', doc.data());
            });
        })
        .catch((error) => {
            console.error("Error getting messages: ", error);
        });
}
