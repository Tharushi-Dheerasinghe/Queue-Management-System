const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// සර්වර් එක වැඩද බලන්න මූලික Route එක
app.get('/', (req, res) => {
    res.send('Queue Management System Server is Running! - Member 6 Work');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});