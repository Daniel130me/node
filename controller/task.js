const Task = require('../model/Task')
const express = require('express');
const app = express();
const cors = require('cors')
const connectdb = require("../connect")
require('dotenv').config({ path: './public/.env'});
// console.log(process.env.MONGO_URI)
const port = 3001;
// Import MySQL library
const mysql = require('mysql');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// // Set up the connection to the database
// var conn = mysql.createConnection({
//     host: process.env.HOST,
//     user: process.env.USER,
//     password: '',
//     database: process.env.DATABASE
// });

// // Connect to the database
// conn.connect(function (err) {
//     if (err) {
//         console.log("error in connection");
//     } else {
//         console.log("connected");
//     }
// });

// Middleware to parse JSON bodies. This line is crucial.
app.use(express.json());
app.use(cors())

const validator = require('validator');
/**
 * Sanitizes input data
 * @param {string|number} data - The input data to sanitize.
 * @returns {string|number} - The sanitized data.
 */
function sanitizeInput(data) {
    if (typeof data === 'string') {
        // Trim leading and trailing spaces
        let sanitizedData = validator.trim(data);
        // Escape HTML entities to prevent HTML injection
        sanitizedData = validator.escape(sanitizedData);
        return sanitizedData;
    } else if (typeof data === 'number') {
        // No sanitization needed for numeric values
        return data;
    } else {
        // Return as is for other data types
        return data;
    }
}



app.get('/', (req, res) => {
    res.send("Hello world")
});


app.post("/createtask", async (req,res)=> {
    try{
        const task = await Task.create(req.body)
        res.status(201).json({task})
    } catch(error) {
        res.status(500).json({msg: error})
    }
})

app.get("/getalltasks", async (req,res)=>{
    try {
        const alltasks = await Task.find({})
        res.status(200).json({ alltasks })
    } catch(error) {
        res.status(500).json({ msg:error })
    }
})

app.get("/gettask/:id", async (req,res)=> {
    // res.json({id:req.params.id})
    try{
        const {id:TaskId} = req.params
        const gettask = await Task.findOne({_id:TaskId})
        res.status(200).json({gettask})
        if(!gettask) {
            res.status(404).json({ msg: `No task with id : ${TaskId}` })
        }
    } catch(error) {
        res.status(500).json({msg:error})
    }
})

app.delete("/deletetask/:id", async (req,res)=> {
    // res.json({ id:req.params })
    try{
        const {id:taskid} = req.params
        const task = await Task.findOneAndDelete({_id:taskid})
        if(!task) {
            return res.status(404).json({msg:"record not found"})
        }
        res.status(200).json({ task })
    } catch(error) {
        res.status(404).json({ msg: error})
    }
})
app.patch("/updatetask/:id", async(req,res)=> {
    try{
        const { id:taskid } = req.params;
        const task = await Task.findOneAndUpdate({_id:taskid},req.body, {
            new:true,
            runValidators:true
        })
        if(!task){
            return res.status(404).json({ msg:"data not available"})
        }
        return res.status(200).json({ task })
    } catch(error) {
        res.status(500).json({msg:error})
    }
})

app.get("/getalluser", (req, res) => {
    const sql = "SELECT * FROM user";
    conn.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error fetching data" });
        return res.json({ Status: "success", Result: result });
    });
});

app.post('/create', (req, res) => {
    const name = sanitizeInput(req.body.name);
    const email = sanitizeInput(req.body.email);
    const address = sanitizeInput(req.body.address);
    const salary = sanitizeInput(req.body.salary);
    conn.query("INSERT INTO user(name,email,address,salary) VALUES(?,?,?,?)", [name, email, address, salary], (err, result) => {
        if (err) return res.json({ Error: "error inserting data" });
        return res.json({ Status: "success" });
    });
});

app.get('/getuser/:id', (req, res) => {
    const id = req.params.id;
    conn.query(`SELECT name, email, address, salary FROM user WHERE id=?`, [id], (err, result) => {
        if (err) return res.json({ Error: 'Error fetching data' });
        return res.json({ Status: 'success', result });
    });
});


app.put('/update/:id', (req, res) => {
    const name = sanitizeInput(req.body.name);
    const email = sanitizeInput(req.body.email);
    const salary = sanitizeInput(req.body.salary);
    const address = sanitizeInput(req.body.address);
    const id = req.params.id;
    conn.query("UPDATE user SET name=?, email=?, address=?, salary=? WHERE id=?", [name, email, address, salary, id], (err, result) => {
        if (err) return res.json({ Error: "error updating data" });
        return res.json({ Status: "success", Result: result });
    });
});

app.delete("/deleteuser/:id", (req, res) => {
    const id = sanitizeInput(req.params.id)
    conn.query("DELETE FROM user WHERE id=?", [id], (err, result) => {
        if (err) return res.json({ Error: 'Error deleting the data' })
        return res.json({ Status: 'success' });
    })
})

app.get("/usercount", (req, res) => {
    conn.query("SELECT count(id) AS usercount FROM user", (err, result) => {
        if (err) return res.json({ Error: 'Error getting data' })
        return res.json(result)
    })
})

app.get("/totalsalary", (req, res) => {
    conn.query("SELECT sum(salary) AS sumsalary FROM user", (err, result) => {
        if (err) return res.json({ Error: 'error getting data' })
        return res.json(result)
    })
})

app.post("/register", (req, res) => {
    bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
        if (err) return res.json({ Error: 'error in hashing password' })
        const values = [req.body.name, req.body.email, hash]
        conn.query("INSERT INTO user(name, email, password) VALUES(?)", [values], (err, result) => {
            if (err) return res.json({ Error: 'error' })
            return res.json(result)
        })
    })
})

app.post("/login", (req, res) => {
    const emailq = req.body.email;

    // return res.send(emailq)

    conn.query("SELECT * FROM user WHERE email=?", [emailq], (err, result) => {

        if (result.length > 0) {
            // return res.json(result[0].password)
            bcrypt.compare(req.body.password.toString(), result[0].password, (err, response) => {
                // if (err) return res.json({ Error: 'error in getting email pass' })
                if (response) {
                    const token = jwt.sign({ role: "admin" }, "jwt-secret-key", { expiresIn: '1d' });
                    return res.json({ Status: "success", Token: token })
                }
                else {
                    return res.json({ Error: 'password or email incorrect' })
                }
            })
        }
        else {
            return res.json({ Error: 'no emil' })
        }
    })
})

const start = async ()=>{
    try {
        await connectdb(process.env.MONGO_URI)
        app.listen(port, console.log(`Example app is listening on port ${port}`))
    }
    catch (error) {
        console.log(error)
    }
}
start()
// app.listen(port, () => {
//     console.log(`Example app is listening on port ${port}`);
// });
