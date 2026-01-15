# Documentação de Integração - Backend Teacher App

## Visão Geral
Este backend utiliza Socket.io para comunicação em tempo real. O frontend precisa conectar-se via WebSocket e implementar os eventos descritos abaixo.

## Configuração Inicial

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar Servidor
```bash
npm start
# ou para desenvolvimento com auto-reload
npm run dev
```

O servidor estará disponível em `http://localhost:3000` (ou porta definida em PORT).

### 3. Conectar Frontend ao Socket.io

No frontend, instale o cliente Socket.io:
```bash
npm install socket.io-client
```

Conecte-se ao servidor:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});
```

## Eventos Socket.io - Especificação Completa

### EVENTOS EMITIDOS PELO FRONTEND (socket.emit)

#### 1. `user:join` - Entrar no Sistema
**Quando usar:** Assim que o usuário informar nome e tipo (teacher/student).

**Payload:**
```javascript
socket.emit('user:join', {
  name: 'João Silva',        // string, obrigatório
  type: 'teacher'            // string, obrigatório: 'teacher' ou 'student'
});
```

**Resposta esperada:** Evento `user:joined` será recebido.

---

#### 2. `question:create` - Criar Questão (Apenas Teacher)
**Quando usar:** Quando um teacher criar uma nova questão.

**Payload:**
```javascript
socket.emit('question:create', {
  question: 'Qual é a capital do Brasil?',  // string, obrigatório
  options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'],  // array, opcional
  correctAnswer: 'Brasília'  // qualquer tipo, opcional
});
```

**Resposta esperada:** Evento `question:new` será recebido por todos os usuários.

---

#### 3. `answer:submit` - Responder Questão (Apenas Student)
**Quando usar:** Quando um student responder uma questão.

**Payload:**
```javascript
socket.emit('answer:submit', {
  questionId: '1234567890',  // string, obrigatório (ID da questão)
  answer: 'Brasília'         // qualquer tipo, obrigatório (resposta do aluno)
});
```

**Resposta esperada:** Evento `answer:new` será recebido por todos os usuários.

---

#### 4. `question:delete` - Deletar Questão (Apenas Teacher)
**Quando usar:** Quando um teacher deletar uma questão.

**Payload:**
```javascript
socket.emit('question:delete', {
  questionId: '1234567890'  // string, obrigatório (ID da questão)
});
```

**Resposta esperada:** Evento `question:deleted` será recebido por todos os usuários.

---

### EVENTOS RECEBIDOS PELO FRONTEND (socket.on)

#### 1. `user:joined` - Confirmação de Entrada
**Quando recebido:** Após emitir `user:join` com sucesso.

**Payload:**
```javascript
socket.on('user:joined', (data) => {
  // data = {
  //   userId: 'socket_id_123',
  //   name: 'João Silva',
  //   type: 'teacher'
  // }
});
```

---

#### 2. `questions:all` - Todas as Questões Existentes
**Quando recebido:** Imediatamente após `user:joined`, contém todas as questões já criadas.

**Payload:**
```javascript
socket.on('questions:all', (questions) => {
  // questions = [
  //   {
  //     id: '1234567890',
  //     question: 'Qual é a capital do Brasil?',
  //     options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'],
  //     correctAnswer: 'Brasília',
  //     createdBy: 'João Silva',
  //     createdAt: '2024-01-01T12:00:00.000Z'
  //   },
  //   ...
  // ]
});
```

**Ação recomendada:** Armazenar essas questões no estado do frontend para exibição.

---

#### 3. `question:new` - Nova Questão Criada
**Quando recebido:** Quando qualquer teacher cria uma nova questão (em tempo real).

**Payload:**
```javascript
socket.on('question:new', (question) => {
  // question = {
  //   id: '1234567890',
  //   question: 'Qual é a capital do Brasil?',
  //   options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'],
  //   correctAnswer: 'Brasília',
  //   createdBy: 'João Silva',
  //   createdAt: '2024-01-01T12:00:00.000Z'
  // }
});
```

**Ação recomendada:** Adicionar a questão ao estado do frontend e atualizar a UI.

---

#### 4. `answer:new` - Nova Resposta ou Resposta Atualizada
**Quando recebido:** Quando qualquer student responde ou atualiza uma resposta (em tempo real).

**Payload:**
```javascript
socket.on('answer:new', (data) => {
  // data = {
  //   questionId: '1234567890',
  //   answer: {
  //     userId: 'socket_id_456',
  //     userName: 'Maria Santos',
  //     answer: 'Brasília',
  //     submittedAt: '2024-01-01T12:05:00.000Z'
  //   },
  //   allAnswers: [
  //     {
  //       userId: 'socket_id_456',
  //       userName: 'Maria Santos',
  //       answer: 'Brasília',
  //       submittedAt: '2024-01-01T12:05:00.000Z'
  //     },
  //     {
  //       userId: 'socket_id_789',
  //       userName: 'Pedro Costa',
  //       answer: 'São Paulo',
  //       submittedAt: '2024-01-01T12:06:00.000Z'
  //     }
  //   ]
  // }
});
```

**Ação recomendada:** Atualizar o estado das respostas da questão e atualizar a UI em tempo real.

---

#### 5. `question:deleted` - Questão Deletada
**Quando recebido:** Quando qualquer teacher deleta uma questão (em tempo real).

**Payload:**
```javascript
socket.on('question:deleted', (data) => {
  // data = {
  //   questionId: '1234567890'
  // }
});
```

**Ação recomendada:** Remover a questão do estado do frontend e atualizar a UI.

---

#### 6. `user:new` - Novo Usuário Entrou
**Quando recebido:** Quando um novo usuário entra no sistema (exceto você mesmo).

**Payload:**
```javascript
socket.on('user:new', (data) => {
  // data = {
  //   userId: 'socket_id_123',
  //   name: 'João Silva',
  //   type: 'teacher'
  // }
});
```

**Ação recomendada:** Opcional - atualizar lista de usuários online se necessário.

---

#### 7. `user:left` - Usuário Saiu
**Quando recebido:** Quando um usuário desconecta.

**Payload:**
```javascript
socket.on('user:left', (data) => {
  // data = {
  //   userId: 'socket_id_123',
  //   name: 'João Silva',
  //   type: 'teacher'
  // }
});
```

**Ação recomendada:** Opcional - atualizar lista de usuários online se necessário.

---

#### 8. `error` - Erro
**Quando recebido:** Quando ocorre um erro em qualquer operação.

**Payload:**
```javascript
socket.on('error', (data) => {
  // data = {
  //   message: 'Apenas teachers podem criar questões.'
  // }
});
```

**Ação recomendada:** Exibir mensagem de erro para o usuário.

---

## Fluxo Recomendado de Implementação no Frontend

### 1. Tela Inicial (Login/Entrada)
```javascript
// Usuário informa nome e tipo
const handleJoin = (name, type) => {
  socket.emit('user:join', { name, type });
};

// Aguardar confirmação
socket.on('user:joined', (data) => {
  // Redirecionar para tela principal
  // Salvar userId, name, type no estado
});
```

### 2. Tela do Teacher
```javascript
// Ao montar componente, já receberá questions:all
socket.on('questions:all', (questions) => {
  setQuestions(questions);
});

// Criar questão
const createQuestion = (question, options, correctAnswer) => {
  socket.emit('question:create', { question, options, correctAnswer });
};

// Nova questão criada (própria ou de outro teacher)
socket.on('question:new', (question) => {
  setQuestions(prev => [...prev, question]);
});

// Deletar questão
const deleteQuestion = (questionId) => {
  socket.emit('question:delete', { questionId });
};

socket.on('question:deleted', ({ questionId }) => {
  setQuestions(prev => prev.filter(q => q.id !== questionId));
});

// Ver respostas em tempo real
socket.on('answer:new', ({ questionId, allAnswers }) => {
  setAnswers(prev => ({
    ...prev,
    [questionId]: allAnswers
  }));
});
```

### 3. Tela do Student
```javascript
// Ao montar componente, já receberá questions:all
socket.on('questions:all', (questions) => {
  setQuestions(questions);
});

// Nova questão criada por teacher
socket.on('question:new', (question) => {
  setQuestions(prev => [...prev, question]);
});

// Responder questão
const submitAnswer = (questionId, answer) => {
  socket.emit('answer:submit', { questionId, answer });
};

// Ver respostas em tempo real (próprias e de outros students)
socket.on('answer:new', ({ questionId, answer, allAnswers }) => {
  setAnswers(prev => ({
    ...prev,
    [questionId]: allAnswers
  }));
});
```

## Exemplo Completo de Código Frontend (React)

```javascript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('user:joined', (data) => {
      setUser(data);
    });

    newSocket.on('questions:all', (qs) => {
      setQuestions(qs);
    });

    newSocket.on('question:new', (question) => {
      setQuestions(prev => [...prev, question]);
    });

    newSocket.on('answer:new', ({ questionId, allAnswers }) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: allAnswers
      }));
    });

    newSocket.on('question:deleted', ({ questionId }) => {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      const newAnswers = { ...answers };
      delete newAnswers[questionId];
      setAnswers(newAnswers);
    });

    newSocket.on('error', ({ message }) => {
      alert(message);
    });

    return () => newSocket.close();
  }, []);

  const handleJoin = (name, type) => {
    socket.emit('user:join', { name, type });
  };

  const createQuestion = (question, options, correctAnswer) => {
    socket.emit('question:create', { question, options, correctAnswer });
  };

  const submitAnswer = (questionId, answer) => {
    socket.emit('answer:submit', { questionId, answer });
  };

  const deleteQuestion = (questionId) => {
    socket.emit('question:delete', { questionId });
  };

  // Renderizar UI baseado em user.type
  // ...
}
```

## Notas Importantes

1. **Sem Persistência:** Todos os dados são armazenados em memória. Ao reiniciar o servidor, tudo é perdido.

2. **CORS:** O servidor está configurado para aceitar conexões de qualquer origem (`origin: "*"`). Em produção, substitua pelo domínio do frontend.

3. **IDs de Questões:** São gerados usando `Date.now().toString()`, garantindo unicidade.

4. **Respostas Duplicadas:** Se um student responder a mesma questão novamente, a resposta anterior é substituída.

5. **Broadcast:** Todas as ações (criar questão, responder, deletar) são transmitidas em tempo real para todos os usuários conectados.

6. **Health Check:** Endpoint HTTP disponível em `GET /health` retorna status do servidor.

## Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 3000)

## Estrutura de Dados

### Questão
```typescript
interface Question {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: any;
  createdBy: string;
  createdAt: string;
}
```

### Resposta
```typescript
interface Answer {
  userId: string;
  userName: string;
  answer: any;
  submittedAt: string;
}
```

### Usuário (interno, não exposto)
```typescript
interface User {
  name: string;
  type: 'teacher' | 'student';
  socket: Socket;
}
```
