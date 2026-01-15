# Documentação REST API - Backend Teacher App

## Visão Geral
Este backend oferece endpoints REST HTTP para todas as funcionalidades. Você pode usar apenas REST API ou combinar com Socket.io para atualizações em tempo real.

**URL Base:** `http://localhost:3000`

## Autenticação

A autenticação é simples: após fazer login, você receberá um `userId`. Este `userId` deve ser enviado em **todas as requisições** que exigem autenticação através do header `User-ID`.

### Exemplo de uso do header:
```javascript
headers: {
  'Content-Type': 'application/json',
  'User-ID': 'user_1234567890_abc123'
}
```

---

## Endpoints Disponíveis

### 1. POST /api/users/join - Entrar no Sistema

**Descrição:** Registra um novo usuário no sistema e retorna o `userId` necessário para autenticação.

**Método:** `POST`

**URL:** `/api/users/join`

**Body (JSON):**
```json
{
  "name": "João Silva",
  "type": "teacher"
}
```

**Campos:**
- `name` (string, obrigatório): Nome do usuário
- `type` (string, obrigatório): Tipo do usuário - `"teacher"` ou `"student"`

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "user": {
    "userId": "user_1234567890_abc123",
    "name": "João Silva",
    "type": "teacher"
  }
}
```

**Resposta de Erro (400):**
```json
{
  "error": "Dados inválidos. Nome e tipo (teacher/student) são obrigatórios."
}
```

**Exemplo de uso (JavaScript/Fetch):**
```javascript
const response = await fetch('http://localhost:3000/api/users/join', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'João Silva',
    type: 'teacher'
  })
});

const data = await response.json();
// Salvar data.user.userId para usar nas próximas requisições
localStorage.setItem('userId', data.user.userId);
```

---

### 2. GET /api/questions - Listar Todas as Questões

**Descrição:** Retorna todas as questões criadas no sistema.

**Método:** `GET`

**URL:** `/api/questions`

**Autenticação:** Não requerida

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "questions": [
    {
      "id": "1234567890",
      "question": "Qual é a capital do Brasil?",
      "options": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
      "correctAnswer": "Brasília",
      "createdBy": "João Silva",
      "createdAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

**Exemplo de uso:**
```javascript
const response = await fetch('http://localhost:3000/api/questions');
const data = await response.json();
const questions = data.questions;
```

---

### 3. GET /api/questions/:id - Obter Questão Específica

**Descrição:** Retorna uma questão específica pelo ID.

**Método:** `GET`

**URL:** `/api/questions/:id`

**Parâmetros:**
- `id` (string, obrigatório): ID da questão

**Autenticação:** Não requerida

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "question": {
    "id": "1234567890",
    "question": "Qual é a capital do Brasil?",
    "options": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
    "correctAnswer": "Brasília",
    "createdBy": "João Silva",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Resposta de Erro (404):**
```json
{
  "error": "Questão não encontrada."
}
```

**Exemplo de uso:**
```javascript
const questionId = '1234567890';
const response = await fetch(`http://localhost:3000/api/questions/${questionId}`);
const data = await response.json();
const question = data.question;
```

---

### 4. POST /api/questions - Criar Questão (Apenas Teacher)

**Descrição:** Cria uma nova questão. Apenas usuários do tipo `teacher` podem criar questões.

**Método:** `POST`

**URL:** `/api/questions`

**Autenticação:** Requerida (header `User-ID`)

**Body (JSON):**
```json
{
  "question": "Qual é a capital do Brasil?",
  "options": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
  "correctAnswer": "Brasília"
}
```

**Campos:**
- `question` (string, obrigatório): Texto da questão
- `options` (array, opcional): Array de opções de resposta
- `correctAnswer` (qualquer tipo, opcional): Resposta correta

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "question": {
    "id": "1234567890",
    "question": "Qual é a capital do Brasil?",
    "options": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
    "correctAnswer": "Brasília",
    "createdBy": "João Silva",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Resposta de Erro (400):**
```json
{
  "error": "A questão é obrigatória."
}
```

**Resposta de Erro (401):**
```json
{
  "error": "User-ID é obrigatório no header ou body"
}
```

**Resposta de Erro (403):**
```json
{
  "error": "Apenas teachers podem realizar esta ação."
}
```

**Exemplo de uso:**
```javascript
const userId = localStorage.getItem('userId');

const response = await fetch('http://localhost:3000/api/questions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-ID': userId
  },
  body: JSON.stringify({
    question: 'Qual é a capital do Brasil?',
    options: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'],
    correctAnswer: 'Brasília'
  })
});

const data = await response.json();
```

---

### 5. DELETE /api/questions/:id - Deletar Questão (Apenas Teacher)

**Descrição:** Deleta uma questão. Apenas usuários do tipo `teacher` podem deletar questões.

**Método:** `DELETE`

**URL:** `/api/questions/:id`

**Parâmetros:**
- `id` (string, obrigatório): ID da questão

**Autenticação:** Requerida (header `User-ID`)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Questão deletada com sucesso."
}
```

**Resposta de Erro (404):**
```json
{
  "error": "Questão não encontrada."
}
```

**Resposta de Erro (403):**
```json
{
  "error": "Apenas teachers podem realizar esta ação."
}
```

**Exemplo de uso:**
```javascript
const userId = localStorage.getItem('userId');
const questionId = '1234567890';

const response = await fetch(`http://localhost:3000/api/questions/${questionId}`, {
  method: 'DELETE',
  headers: {
    'User-ID': userId
  }
});

const data = await response.json();
```

---

### 6. POST /api/answers - Enviar Resposta (Apenas Student)

**Descrição:** Envia uma resposta para uma questão. Apenas usuários do tipo `student` podem responder.

**Método:** `POST`

**URL:** `/api/answers`

**Autenticação:** Requerida (header `User-ID`)

**Body (JSON):**
```json
{
  "questionId": "1234567890",
  "answer": "Brasília"
}
```

**Campos:**
- `questionId` (string, obrigatório): ID da questão
- `answer` (qualquer tipo, obrigatório): Resposta do aluno

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "answer": {
    "userId": "user_1234567890_abc123",
    "userName": "Maria Santos",
    "answer": "Brasília",
    "submittedAt": "2024-01-01T12:05:00.000Z"
  },
  "allAnswers": [
    {
      "userId": "user_1234567890_abc123",
      "userName": "Maria Santos",
      "answer": "Brasília",
      "submittedAt": "2024-01-01T12:05:00.000Z"
    },
    {
      "userId": "user_9876543210_xyz789",
      "userName": "Pedro Costa",
      "answer": "São Paulo",
      "submittedAt": "2024-01-01T12:06:00.000Z"
    }
  ]
}
```

**Resposta de Erro (400):**
```json
{
  "error": "ID da questão e resposta são obrigatórios."
}
```

**Resposta de Erro (404):**
```json
{
  "error": "Questão não encontrada."
}
```

**Resposta de Erro (403):**
```json
{
  "error": "Apenas students podem realizar esta ação."
}
```

**Exemplo de uso:**
```javascript
const userId = localStorage.getItem('userId');

const response = await fetch('http://localhost:3000/api/answers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-ID': userId
  },
  body: JSON.stringify({
    questionId: '1234567890',
    answer: 'Brasília'
  })
});

const data = await response.json();
// data.allAnswers contém todas as respostas da questão
```

---

### 7. GET /api/answers/:questionId - Listar Respostas de uma Questão

**Descrição:** Retorna todas as respostas de uma questão específica.

**Método:** `GET`

**URL:** `/api/answers/:questionId`

**Parâmetros:**
- `questionId` (string, obrigatório): ID da questão

**Autenticação:** Não requerida

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "questionId": "1234567890",
  "answers": [
    {
      "userId": "user_1234567890_abc123",
      "userName": "Maria Santos",
      "answer": "Brasília",
      "submittedAt": "2024-01-01T12:05:00.000Z"
    },
    {
      "userId": "user_9876543210_xyz789",
      "userName": "Pedro Costa",
      "answer": "São Paulo",
      "submittedAt": "2024-01-01T12:06:00.000Z"
    }
  ],
  "total": 2
}
```

**Resposta de Erro (404):**
```json
{
  "error": "Questão não encontrada."
}
```

**Exemplo de uso:**
```javascript
const questionId = '1234567890';
const response = await fetch(`http://localhost:3000/api/answers/${questionId}`);
const data = await response.json();
const answers = data.answers;
```

---

### 8. GET /api/users/me - Obter Informações do Usuário Atual

**Descrição:** Retorna informações do usuário autenticado.

**Método:** `GET`

**URL:** `/api/users/me`

**Autenticação:** Requerida (header `User-ID`)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "user": {
    "userId": "user_1234567890_abc123",
    "name": "João Silva",
    "type": "teacher"
  }
}
```

**Exemplo de uso:**
```javascript
const userId = localStorage.getItem('userId');

const response = await fetch('http://localhost:3000/api/users/me', {
  headers: {
    'User-ID': userId
  }
});

const data = await response.json();
const user = data.user;
```

---

### 9. GET /health - Health Check

**Descrição:** Verifica o status do servidor.

**Método:** `GET`

**URL:** `/health`

**Autenticação:** Não requerida

**Resposta (200):**
```json
{
  "status": "ok",
  "usersSocket": 5,
  "usersREST": 3,
  "questions": 10
}
```

---

## Fluxo Completo de Uso

### 1. Tela de Login/Entrada

```javascript
// Usuário informa nome e tipo
const handleLogin = async (name, type) => {
  try {
    const response = await fetch('http://localhost:3000/api/users/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, type })
    });

    const data = await response.json();
    
    if (data.success) {
      // Salvar userId para usar nas próximas requisições
      localStorage.setItem('userId', data.user.userId);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userType', data.user.type);
      
      // Redirecionar para tela principal
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error);
  }
};
```

### 2. Tela do Teacher

```javascript
// Carregar questões ao montar componente
useEffect(() => {
  const loadQuestions = async () => {
    const response = await fetch('http://localhost:3000/api/questions');
    const data = await response.json();
    setQuestions(data.questions);
  };
  
  loadQuestions();
  
  // Opcional: Polling para atualizar questões a cada 2 segundos
  const interval = setInterval(loadQuestions, 2000);
  return () => clearInterval(interval);
}, []);

// Criar questão
const createQuestion = async (question, options, correctAnswer) => {
  const userId = localStorage.getItem('userId');
  
  const response = await fetch('http://localhost:3000/api/questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify({ question, options, correctAnswer })
  });
  
  const data = await response.json();
  if (data.success) {
    setQuestions(prev => [...prev, data.question]);
  }
};

// Deletar questão
const deleteQuestion = async (questionId) => {
  const userId = localStorage.getItem('userId');
  
  const response = await fetch(`http://localhost:3000/api/questions/${questionId}`, {
    method: 'DELETE',
    headers: {
      'User-ID': userId
    }
  });
  
  const data = await response.json();
  if (data.success) {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  }
};

// Carregar respostas de uma questão
const loadAnswers = async (questionId) => {
  const response = await fetch(`http://localhost:3000/api/answers/${questionId}`);
  const data = await response.json();
  setAnswers(prev => ({
    ...prev,
    [questionId]: data.answers
  }));
};
```

### 3. Tela do Student

```javascript
// Carregar questões ao montar componente
useEffect(() => {
  const loadQuestions = async () => {
    const response = await fetch('http://localhost:3000/api/questions');
    const data = await response.json();
    setQuestions(data.questions);
  };
  
  loadQuestions();
  
  // Opcional: Polling para atualizar questões a cada 2 segundos
  const interval = setInterval(loadQuestions, 2000);
  return () => clearInterval(interval);
}, []);

// Responder questão
const submitAnswer = async (questionId, answer) => {
  const userId = localStorage.getItem('userId');
  
  const response = await fetch('http://localhost:3000/api/answers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-ID': userId
    },
    body: JSON.stringify({ questionId, answer })
  });
  
  const data = await response.json();
  if (data.success) {
    // Atualizar respostas localmente
    setAnswers(prev => ({
      ...prev,
      [questionId]: data.allAnswers
    }));
  }
};

// Carregar respostas de uma questão (para ver respostas de outros alunos)
const loadAnswers = async (questionId) => {
  const response = await fetch(`http://localhost:3000/api/answers/${questionId}`);
  const data = await response.json();
  setAnswers(prev => ({
    ...prev,
    [questionId]: data.answers
  }));
};
```

---

## Tratamento de Erros

Sempre verifique o status da resposta e trate erros adequadamente:

```javascript
const handleRequest = async (url, options) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      // Erro retornado pelo servidor
      throw new Error(data.error || 'Erro na requisição');
    }
    
    return data;
  } catch (error) {
    // Erro de rede ou outro erro
    console.error('Erro:', error);
    alert(error.message);
    throw error;
  }
};
```

---

## Códigos de Status HTTP

- `200` - Sucesso (GET, DELETE)
- `201` - Criado com sucesso (POST)
- `400` - Dados inválidos
- `401` - Não autenticado (User-ID faltando ou inválido)
- `403` - Sem permissão (tipo de usuário incorreto)
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

---

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
  updatedAt?: string; // Se a resposta foi atualizada
}
```

### Usuário
```typescript
interface User {
  userId: string;
  name: string;
  type: 'teacher' | 'student';
}
```

---

## Notas Importantes

1. **Autenticação:** Sempre envie o `User-ID` no header para requisições que exigem autenticação.

2. **Tempo Real:** Os endpoints REST não fornecem atualizações em tempo real. Para isso, use Socket.io (veja `INTEGRACAO_FRONTEND.md`) ou implemente polling (atualizar dados periodicamente).

3. **Polling:** Para simular tempo real com REST, você pode fazer requisições periódicas:
   ```javascript
   setInterval(async () => {
     const response = await fetch('http://localhost:3000/api/questions');
     const data = await response.json();
     setQuestions(data.questions);
   }, 2000); // Atualizar a cada 2 segundos
   ```

4. **Armazenamento:** Salve o `userId` após o login (localStorage, sessionStorage, ou estado da aplicação).

5. **CORS:** O servidor está configurado para aceitar requisições de qualquer origem. Em produção, configure adequadamente.

6. **Sem Persistência:** Todos os dados são armazenados em memória. Ao reiniciar o servidor, tudo é perdido.

---

## Exemplo Completo (React Hook)

```javascript
import { useState, useEffect } from 'react';

function useTeacherApp() {
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  const API_BASE = 'http://localhost:3000/api';

  // Login
  const login = async (name, type) => {
    const response = await fetch(`${API_BASE}/users/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type })
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('userId', data.user.userId);
      setUserId(data.user.userId);
      setUser(data.user);
      return data.user;
    }
    throw new Error(data.error);
  };

  // Carregar questões
  const loadQuestions = async () => {
    const response = await fetch(`${API_BASE}/questions`);
    const data = await response.json();
    if (data.success) {
      setQuestions(data.questions);
    }
  };

  // Criar questão (teacher)
  const createQuestion = async (question, options, correctAnswer) => {
    const response = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId
      },
      body: JSON.stringify({ question, options, correctAnswer })
    });
    const data = await response.json();
    if (data.success) {
      setQuestions(prev => [...prev, data.question]);
    }
    return data;
  };

  // Responder questão (student)
  const submitAnswer = async (questionId, answer) => {
    const response = await fetch(`${API_BASE}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId
      },
      body: JSON.stringify({ questionId, answer })
    });
    const data = await response.json();
    if (data.success) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: data.allAnswers
      }));
    }
    return data;
  };

  // Carregar respostas
  const loadAnswers = async (questionId) => {
    const response = await fetch(`${API_BASE}/answers/${questionId}`);
    const data = await response.json();
    if (data.success) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: data.answers
      }));
    }
    return data;
  };

  // Auto-carregar questões
  useEffect(() => {
    if (userId) {
      loadQuestions();
      const interval = setInterval(loadQuestions, 2000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  return {
    userId,
    user,
    questions,
    answers,
    login,
    loadQuestions,
    createQuestion,
    submitAnswer,
    loadAnswers
  };
}
```

---

## Combinando REST + Socket.io

Para melhor experiência, você pode usar REST para operações principais e Socket.io apenas para receber atualizações em tempo real:

```javascript
// Usar REST para criar questão
await createQuestion(question, options, correctAnswer);

// Usar Socket.io apenas para escutar novas questões/respostas
socket.on('question:new', (newQuestion) => {
  setQuestions(prev => [...prev, newQuestion]);
});

socket.on('answer:new', ({ questionId, allAnswers }) => {
  setAnswers(prev => ({
    ...prev,
    [questionId]: allAnswers
  }));
});
```
