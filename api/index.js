const express = require("express");

const path = require("path");
const app = express();

const { Pool } = require("pg");
const cors = require("cors");
require('dotenv').config();


app.use(express.json());
app.use(express.static(path.join(__dirname, "../public"))); // Serve static files from the 'public' directory
app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html")); // Update path to point to 'public' directory
});


const { DATABASE_URL, SECRET_KEY } = process.env;

// Initialize the PostgreSQL connection
const pool = new Pool({
  connectionString: DATABASE_URL,

  ssl: {
    rejectUnauthorized: false,
  },
});

(async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully');
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
  }
})();


app.get('/expenses', async function fetchExpense(req, res) {
  const client = await pool.connect();
  try {
    const query = await client.query("SELECT * FROM EXPENSES");
    console.log(query.rows);
    res.status(200).json(query.rows)

  } catch (error) {
    console.error(error.message);
  } finally {
    client.release();
  }
}
)


//Post endpoint to save expense
app.post('/expenses', async function addExpense(req, res) {
  const client = await pool.connect();
  try {
    const { subject, merchant, date, category, description, employee, team, amount, report, invoiceUrl } = req.body;
    const param = [subject, merchant, date, category, description, employee, team, amount, report, invoiceUrl];
    const query = 'INSERT INTO EXPENSES(subject, merchant, date, category, description, employee, team, amount, report, invoiceUrl) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *';
    
    // Await the execution of the query
    const result = await client.query(query, param);
    console.log(result.rows[0]); // Log the newly created expense
    
    // Send a response back to the client
    res.status(201).json({ message: 'Expense added successfully', expense: result.rows[0] });
    
  } catch (error) {
    console.error(error.message);
    // Send a response indicating the error
    res.status(500).json({ message: 'Failed to add expense', error: error.message });
  } finally {
    client.release();
  }
});

app.get('/trips', async function fetchTrips(req, res) {
  const client = await pool.connect();
  try {
    const query = await client.query("SELECT * FROM trips");
    console.log(query.rows);
    res.status(200).json(query.rows)

  } catch (error) {
    console.error(error.message);
  } finally {
    client.release();
  }
}
)

app.get('/test', (req, res) => {
  res.send('Test route is working');
})


app.get('/trips/user/:uid', async (req, res) => {
  const client = await pool.connect();

  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ error: 'Invalid UID parameter' });
    }

    // Correct SQL query
    const query = "SELECT * FROM trips WHERE uid = $1";
    const params = [uid];
    const result = await client.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Database query error:', error.message);
    res.status(500).json({ error: 'Server Error' });
  } finally {
    client.release();
  }
});

//Delete expense endpoint
app.delete('/expenses/:id', async (req, res) => {
  const { id } = req.params;// Get ID from request parameters

  try {
    // Query to delete expense
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      message: 'Expense deleted successfully',
      expense: result.rows[0]
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Server Error'
    })
  }
})


//Delete trip endpoint
app.delete('/trips/:id', async(req, res)=>{
  const { id } = req.params;// Get ID from request parameters

  try{
    // Query to delete expense
    const result = await pool.query('DELETE FROM trips WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0){
      return res.status(404).json({
        message: 'Trip not found'
      });
    }

    res.status(200).json({
      message: 'Trip deleted successfully',
      expense: result.rows[0]
    })
  } catch(error){
    console.error(error);
    res.status(500).json({
      message: 'Server Error'
    })
  }
})

//post trips
app.post('/trips', async function addTrip(req, res) {
  const client = await pool.connect();
  try {
    const { name, type, purpose, flight, depart_from, destination, amount,
      start_date, end_date, check_in, check_out, hotel, uid } = req.body;

       console.log(req.body);

    // Validate the request
    const param = [name, type, purpose, flight, depart_from, destination, amount,
      start_date, end_date, check_in, check_out, hotel, uid];


    const query = 'INSERT INTO trips (name, type, purpose, flight, depart_from, destination, amount, start_date, end_date, check_in, check_out, hotel, uid) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *';
    const result = await client.query(query, param);

    res.status(201).json({
      message: 'Trip added successfully',
      //to extract and retuth the details of the newly inserted trip from the database.
      trip: result.rows[0]
    })

  } catch (error) {
    console.error('Database error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error'
    })
  } finally {
    client.release();
  }
})

//Update trip status
// app.put('/trips/:id', async (req, res) => {
//   const client = await pool.connect();

//   try {
//     const { status } = req.body;
//     const { id } = req.params;

//     console.log('Updating status:', status, 'for trip ID: ', id);

//     //Update the trip status
//     const result = await client.query(
//       'UPDATE trips SET status = $1 WHERE id = $2 RETURNING *',
//       [status, id]
//     );

//     if (result.rows.length > 0) {
//       res.json(result.rows[0]);
//     } else {
//       res.status(404).json({
//         error: 'Trip not found'
//       });
//     }
//   } catch (error) {
//     console.error('Error updating trip status:', error.message);
//     res.status(500).json({
//       error: 'Internal Server error'
//     });
//   } finally {
//     client.release();
//   }
// });

app.put('/trips/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, category, amount, status } = req.body; // Extract all fields you need
    const { id } = req.params;

    console.log('Updating trip:', req.body, 'for trip ID: ', id);

    // Update the trip details
    const result = await client.query(
      'UPDATE trips SET name = $1, category = $2, amount = $3, status = $4 WHERE id = $5 RETURNING *',
      [name, category, amount, status, id]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({
        error: 'Trip not found',
      });
    }
  } catch (error) {
    console.error('Error updating trip:', error.message);
    res.status(500).json({
      error: 'Internal Server error',
    });
  } finally {
    client.release();
  }
});




app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../public", "error.html")); // Update path to point to 'public' directory
});

const PORT = process.env.PORT || 3001; // Use a different port if needed
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = (req, res) => app(req, res);