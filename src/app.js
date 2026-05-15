import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chatRoutes.js';
import acaoRoutes from './routes/acaoRoutes.js';


const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5500" ]}));

app.use(express.json());

app.use('/api', chatRoutes);
app.use('/api/acao', acaoRoutes);



app.get('/', (req, res) => {
  res.send('Mini Travel Planner Backend funcionando');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
