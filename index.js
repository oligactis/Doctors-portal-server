const express = require('express')
const app = express()
const cors = require('cors')
const admin = require("firebase-admin");
require('dotenv').config()
//mongodb
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000;
//73.8
// doctors-portal-firebase-adminsdk.json
const serviceAccount = require('./doctors-portal-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
//73.8

//middleware
app.use(cors());
app.use(express.json()); //v 72.3


// from mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.far0qag.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
//73.8
async function verifytoken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1];
    const email = await admin.auth().verifyIdToken(token);
    req.decodedEmail = email?.email;
  }
  next();
}

//73.8




async function run() {
  try {
    const tes = await client.connect()
    // console.log('database connected')
    // v 72.3 
    const database = client.db('doctors_portal');
    const appointmentsCollection = database.collection('appointments');
    const usersCollection = database.collection('users');

    // v 72.7 
    app.get('/appointments', async (req, res) => {
      const email = req.query.email;
      const date = req.query.date; // v 72.9
      console.log(email, date)
      const query = { email, date } // v 72.9
      const cursor = appointmentsCollection.find(query)
      const appointments = await cursor.toArray();
      res.json(appointments);
    })

    app.post('/appointments', async (req, res) => {
      const appointment = req.body;
      const result = await appointmentsCollection.insertOne(appointment);
      res.json(result)
    })

    // get method 
    app.get('/users/:email', verifytoken, async (req, res) => {
      const email = req.params.email;
      const quary = { email: email };
      const user = await usersCollection.findOne(quary);
      let isAdmin = false;
      if (user?.role === 'admin') {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user)
      res.json(result);
    })

    app.get("/getusers", async (req, res) => {
      const cursor = usersCollection.find({});
      const result = await cursor.toArray();
      res.json(result);
    })

    app.put('/users', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    })


    app.put('/users/admin', verifytoken, async (req, res) => {
      const user = req.body;
      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = await usersCollection.findOne({ email: requester });
        if (requesterAccount?.role === 'admin') {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: `admin` } };
          const result = await usersCollection.updateOne(filter, updateDoc)
          res.json(result);
        }
      }
      else {
        res.status(401).json({ message: 'you don not have access to make admin' })
      }
    })

  }
  finally {
    // await client.close()
  }
}

run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('the server is runnign')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

/*
naming convantion 

app.get('/users')all user k neoya
app.post('/users') specific 1 ta user k neoya
app.get('/users/:id') specific 1 ta user neoya filter kore email or id
app.put('/users/:id') specific 1 ta user k update kora
app.delete('/users/:id')specific 1 ta user delete kora
*/