const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configuração do Socket.io com CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Em produção, substitua pelo domínio do frontend
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Armazenamento em memória (sem banco de dados)
const users = new Map(); // socketId -> { name, type, socket }
const questions = []; // Array de questões criadas
const answers = new Map(); // questionId -> [{ userId, userName, answer }]

// Eventos Socket.io
io.on('connection', (socket) => {
  console.log('Novo usuário conectado:', socket.id);

  // Usuário entra no sistema
  socket.on('user:join', (data) => {
    const { name, type } = data;
    
    if (!name || !type || (type !== 'teacher' && type !== 'student')) {
      socket.emit('error', { message: 'Dados inválidos. Nome e tipo (teacher/student) são obrigatórios.' });
      return;
    }

    // Armazena usuário em memória
    users.set(socket.id, {
      name,
      type,
      socket
    });

    // Confirma entrada
    socket.emit('user:joined', {
      userId: socket.id,
      name,
      type
    });

    // Envia questões existentes para o novo usuário
    socket.emit('questions:all', questions);

    // Notifica outros usuários sobre novo participante
    socket.broadcast.emit('user:new', {
      userId: socket.id,
      name,
      type
    });

    console.log(`${type} ${name} entrou no sistema`);
  });

  // Teacher cria uma nova questão
  socket.on('question:create', (data) => {
    const user = users.get(socket.id);
    
    if (!user || user.type !== 'teacher') {
      socket.emit('error', { message: 'Apenas teachers podem criar questões.' });
      return;
    }

    const { question, options, correctAnswer } = data;

    if (!question) {
      socket.emit('error', { message: 'A questão é obrigatória.' });
      return;
    }

    const newQuestion = {
      id: Date.now().toString(),
      question,
      options: options || [],
      correctAnswer: correctAnswer || null,
      createdBy: user.name,
      createdAt: new Date().toISOString()
    };

    questions.push(newQuestion);
    answers.set(newQuestion.id, []);

    // Broadcast para todos os usuários
    io.emit('question:new', newQuestion);

    console.log(`Teacher ${user.name} criou questão: ${question}`);
  });

  // Student responde uma questão
  socket.on('answer:submit', (data) => {
    const user = users.get(socket.id);
    
    if (!user || user.type !== 'student') {
      socket.emit('error', { message: 'Apenas students podem responder questões.' });
      return;
    }

    const { questionId, answer } = data;

    if (!questionId || answer === undefined || answer === null) {
      socket.emit('error', { message: 'ID da questão e resposta são obrigatórios.' });
      return;
    }

    // Verifica se a questão existe
    const question = questions.find(q => q.id === questionId);
    if (!question) {
      socket.emit('error', { message: 'Questão não encontrada.' });
      return;
    }

    // Remove resposta anterior do mesmo usuário (se houver)
    const questionAnswers = answers.get(questionId) || [];
    const existingAnswerIndex = questionAnswers.findIndex(a => a.userId === socket.id);
    
    if (existingAnswerIndex !== -1) {
      questionAnswers[existingAnswerIndex].answer = answer;
      questionAnswers[existingAnswerIndex].updatedAt = new Date().toISOString();
    } else {
      questionAnswers.push({
        userId: socket.id,
        userName: user.name,
        answer,
        submittedAt: new Date().toISOString()
      });
    }

    answers.set(questionId, questionAnswers);

    // Broadcast para todos os usuários
    io.emit('answer:new', {
      questionId,
      answer: {
        userId: socket.id,
        userName: user.name,
        answer,
        submittedAt: new Date().toISOString()
      },
      allAnswers: questionAnswers
    });

    console.log(`Student ${user.name} respondeu questão ${questionId}: ${answer}`);
  });

  // Teacher pode deletar uma questão
  socket.on('question:delete', (data) => {
    const user = users.get(socket.id);
    
    if (!user || user.type !== 'teacher') {
      socket.emit('error', { message: 'Apenas teachers podem deletar questões.' });
      return;
    }

    const { questionId } = data;

    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
      socket.emit('error', { message: 'Questão não encontrada.' });
      return;
    }

    questions.splice(questionIndex, 1);
    answers.delete(questionId);

    // Broadcast para todos os usuários
    io.emit('question:deleted', { questionId });

    console.log(`Teacher ${user.name} deletou questão ${questionId}`);
  });

  // Desconexão
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`${user.type} ${user.name} desconectou`);
      
      // Notifica outros usuários
      socket.broadcast.emit('user:left', {
        userId: socket.id,
        name: user.name,
        type: user.type
      });

      users.delete(socket.id);
    }
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    users: users.size,
    questions: questions.length 
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Socket.io disponível em http://localhost:${PORT}`);
});
