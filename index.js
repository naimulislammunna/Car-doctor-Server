require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const port = process.env.port || 2000;

const app = express();
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser())

app.get('/', (req, res) => {
    // console.log('server ok');
    res.send('client server ok')

})

app.listen(port, () => {
    console.log('port is running:', port);
})


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@express-explore.use1c.mongodb.net/?retryWrites=true&w=majority&appName=express-explore`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('car-doctor').collection('services');
        const checkOutCollection = client.db('car-doctor').collection('chekOut');

        const verifyToken = (req, res, next) => {
            const token = req.cookies?.token;
            if (!token) {
                return res.status(401).send({ message: 'Forbidden' })
            }
            jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
                if(err){
                    return res.send({status: 'jwt expire'})
                }
                req.userJwt = decoded;
                console.log('decoded', decoded);
                
                next()
            })
            console.log("veri:tken:", token);
            
        }

        // Auth api 
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1h' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false
                })
                .send({ success: true })
        })

        // normal API
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await serviceCollection.findOne(query);
            res.send(result);

        })

        app.get('/my-service', verifyToken, async (req, res) => {
            const getEmail = req.query.email;
            if(getEmail !== req.userJwt.email){
                return res.send({status: 'user dont match'})
            }
            let query = {};
            if (req.query?.email) {
                query = { gmail: getEmail }
            }
            const result = await checkOutCollection.find(query).toArray();
            res.send(result);

        })

        app.get('/check-out/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await serviceCollection.findOne(query);
            res.send(result);

        })

        app.post('/checkout', async (req, res) => {
            const query = req.body;
            const result = await checkOutCollection.insertOne(query);
            res.send(result);

        })

        app.delete('/my-service/:id', async (req, res) => {
            const id = req.params.id;
            const deleteQuery = { _id: new ObjectId(id) };

            const result = await checkOutCollection.deleteOne(deleteQuery);
            res.send(result);
            console.log(result);

        })

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

