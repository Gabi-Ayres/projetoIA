import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chatRoutes.js';
import roteiroRoutes from './routes/roteiroRoutes.js';
import testeCallingRoutes from './routes/testeCallingRoutes.js';
import routesGenerete from './routes/routesGenerete.js';


const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5500" ]}));

app.use(express.json());

app.use('/api', chatRoutes);
app.use('/api/roteiro', roteiroRoutes);
app.use('/api/teste', testeCallingRoutes);
app.use('/api/generate', routesGenerete);



app.get('/', (req, res) => {
  res.send('Mini Travel Planner Backend funcionando');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
