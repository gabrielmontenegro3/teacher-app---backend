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
const usersREST = new Map(); // userId -> { name, type, userId }
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

// ==================== ENDPOINTS REST API ====================

// Função auxiliar para obter ou criar usuário
// Usa uma chave baseada em nome+tipo para garantir consistência
const getOrCreateUser = (name, type) => {
  if (!name || !type || (type !== 'teacher' && type !== 'student')) {
    return null;
  }

  // Cria uma chave única baseada em nome e tipo
  const userKey = `${name}_${type}`;

  // Procura usuário existente com mesmo nome e tipo
  for (const [userId, user] of usersREST.entries()) {
    if (user.name === name && user.type === type) {
      return user;
    }
  }

  // Cria novo usuário se não existir
  // Usa hash simples do nome+tipo para gerar userId consistente
  const userId = `user_${Buffer.from(userKey).toString('base64').substring(0, 20)}_${Date.now()}`;
  const user = {
    userId,
    name,
    type
  };

  usersREST.set(userId, user);
  return user;
};

// Middleware para validar usuário autenticado (aceita name e type diretamente)
const validateUser = (req, res, next) => {
  const { name, type } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ 
      error: 'Nome e tipo (teacher/student) são obrigatórios no body da requisição.' 
    });
  }

  if (type !== 'teacher' && type !== 'student') {
    return res.status(400).json({ 
      error: 'Tipo deve ser "teacher" ou "student".' 
    });
  }

  const user = getOrCreateUser(name, type);
  if (!user) {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  req.user = user;
  next();
};

// Middleware para validar se é teacher
const validateTeacher = (req, res, next) => {
  if (req.user.type !== 'teacher') {
    return res.status(403).json({ error: 'Apenas teachers podem realizar esta ação.' });
  }
  next();
};

// Middleware para validar se é student
const validateStudent = (req, res, next) => {
  if (req.user.type !== 'student') {
    return res.status(403).json({ error: 'Apenas students podem realizar esta ação.' });
  }
  next();
};

// POST /api/users/join - Entrar no sistema
app.post('/api/users/join', (req, res) => {
  const { name, type } = req.body;

  if (!name || !type || (type !== 'teacher' && type !== 'student')) {
    return res.status(400).json({ 
      error: 'Dados inválidos. Nome e tipo (teacher/student) são obrigatórios.' 
    });
  }

  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const user = {
    userId,
    name,
    type
  };

  usersREST.set(userId, user);

  // Broadcast via Socket.io para usuários conectados
  io.emit('user:new', {
    userId,
    name,
    type
  });

  console.log(`${type} ${name} entrou no sistema via REST (ID: ${userId})`);

  res.status(201).json({
    success: true,
    user: {
      userId,
      name,
      type
    }
  });
});

// GET /api/questions - Listar todas as questões
app.get('/api/questions', (req, res) => {
  res.json({
    success: true,
    questions: questions
  });
});

// GET /api/questions/:id - Obter uma questão específica
app.get('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  const question = questions.find(q => q.id === id);

  if (!question) {
    return res.status(404).json({ error: 'Questão não encontrada.' });
  }

  res.json({
    success: true,
    question
  });
});

// POST /api/questions - Criar questão (apenas teacher)
app.post('/api/questions', validateUser, validateTeacher, (req, res) => {
  const { question, options, correctAnswer } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'A questão é obrigatória.' });
  }

  const newQuestion = {
    id: Date.now().toString(),
    question,
    options: options || [],
    correctAnswer: correctAnswer || null,
    createdBy: req.user.name,
    createdAt: new Date().toISOString()
  };

  questions.push(newQuestion);
  answers.set(newQuestion.id, []);

  // Broadcast via Socket.io para usuários conectados
  io.emit('question:new', newQuestion);

  console.log(`Teacher ${req.user.name} criou questão via REST: ${question}`);

  res.status(201).json({
    success: true,
    question: newQuestion
  });
});

// DELETE /api/questions/:id - Deletar questão (apenas teacher)
app.delete('/api/questions/:id', validateUser, validateTeacher, (req, res) => {
  const { id } = req.params;

  const questionIndex = questions.findIndex(q => q.id === id);
  if (questionIndex === -1) {
    return res.status(404).json({ error: 'Questão não encontrada.' });
  }

  questions.splice(questionIndex, 1);
  answers.delete(id);

  // Broadcast via Socket.io para usuários conectados
  io.emit('question:deleted', { questionId: id });

  console.log(`Teacher ${req.user.name} deletou questão via REST: ${id}`);

  res.json({
    success: true,
    message: 'Questão deletada com sucesso.'
  });
});

// POST /api/answers - Enviar resposta (apenas student)
app.post('/api/answers', validateUser, validateStudent, (req, res) => {
  const { questionId, answer } = req.body;

  if (!questionId || answer === undefined || answer === null) {
    return res.status(400).json({ 
      error: 'ID da questão e resposta são obrigatórios.' 
    });
  }

  const question = questions.find(q => q.id === questionId);
  if (!question) {
    return res.status(404).json({ error: 'Questão não encontrada.' });
  }

  const questionAnswers = answers.get(questionId) || [];
  // Usa userName para encontrar resposta existente (mais consistente que userId)
  const existingAnswerIndex = questionAnswers.findIndex(a => a.userName === req.user.name);

  const answerData = {
    userId: req.user.userId,
    userName: req.user.name,
    answer,
    submittedAt: new Date().toISOString()
  };

  if (existingAnswerIndex !== -1) {
    questionAnswers[existingAnswerIndex] = {
      ...answerData,
      updatedAt: new Date().toISOString()
    };
  } else {
    questionAnswers.push(answerData);
  }

  answers.set(questionId, questionAnswers);

  // Broadcast via Socket.io para usuários conectados
  io.emit('answer:new', {
    questionId,
    answer: answerData,
    allAnswers: questionAnswers
  });

  console.log(`Student ${req.user.name} respondeu questão via REST ${questionId}: ${answer}`);

  res.status(201).json({
    success: true,
    answer: answerData,
    allAnswers: questionAnswers
  });
});

// GET /api/answers/:questionId - Listar respostas de uma questão
app.get('/api/answers/:questionId', (req, res) => {
  const { questionId } = req.params;

  const question = questions.find(q => q.id === questionId);
  if (!question) {
    return res.status(404).json({ error: 'Questão não encontrada.' });
  }

  const questionAnswers = answers.get(questionId) || [];

  res.json({
    success: true,
    questionId,
    answers: questionAnswers,
    total: questionAnswers.length
  });
});

// GET /api/users/me - Obter informações do usuário atual
app.get('/api/users/me', validateUser, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    usersSocket: users.size,
    usersREST: usersREST.size,
    questions: questions.length 
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Socket.io disponível em http://localhost:${PORT}`);
});
