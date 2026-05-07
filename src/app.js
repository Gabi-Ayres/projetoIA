import express from 'express';
import cors from 'cors';
//import taskRoutes from './routes/taskRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

//app.use('/api/tasks', taskRoutes);
app.use('/', chatRoutes);

app.get('/', (req, res) => {
  res.send('Mini ClickUp Backend funcionando');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
