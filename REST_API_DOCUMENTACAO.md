# Documentação REST API - Backend Teacher App

## Visão Geral
Este backend oferece endpoints REST HTTP para todas as funcionalidades. Você pode usar apenas REST API ou combinar com Socket.io para atualizações em tempo real.

**URL Base:** `http://localhost:3000`

## Autenticação

**NÃO É NECESSÁRIO FAZER LOGIN!** 

A autenticação é automática: basta enviar `name` e `type` no **body** de cada requisição que exige autenticação. O sistema criará ou encontrará o usuário automaticamente.

### Exemplo de body com autenticação:
```javascript
{
  "name": "João Silva",
  "type": "teacher",
  // ... outros campos da requisição
}
```

**Importante:** 
- `name` e `type` são obrigatórios no body para criar questões (teacher) ou responder (student)
- O mesmo `name` + `type` sempre retornará o mesmo usuário (consistente)
- Não é necessário fazer login prévio via `/api/users/join`

---

## Endpoints Disponíveis

### 1. POST /api/users/join - Entrar no Sistema (OPCIONAL)

**Descrição:** Este endpoint é **opcional**. Você pode usá-lo se quiser registrar explicitamente um usuário, mas não é necessário. Você pode simplesmente enviar `name` e `type` diretamente nas requisições de criar questão ou responder.

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

**Nota:** Este endpoint é opcional. Você pode pular este passo e ir direto para criar questões ou responder, enviando `name` e `type` no body.

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

**Autenticação:** Requerida (envie `name` e `type` no body)

**Body (JSON):**
```json
{
  "name": "João Silva",
  "type": "teacher",
  "question": "Qual é a capital do Brasil?",
  "options": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
  "correctAnswer": "Brasília"
}
```

**Campos:**
- `name` (string, obrigatório): Nome do teacher
- `type` (string, obrigatório): Deve ser `"teacher"`
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
  "error": "Nome e tipo (teacher/student) são obrigatórios no body da requisição."
}
```

ou

```json
{
  "error": "A questão é obrigatória."
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
const response = await fetch('http://localhost:3000/api/questions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'João Silva',
    type: 'teacher',
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

**Autenticação:** Requerida (envie `name` e `type` no body)

**Body (JSON):**
```json
{
  "name": "João Silva",
  "type": "teacher"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Questão deletada com sucesso."
}
```

**Resposta de Erro (400):**
```json
{
  "error": "Nome e tipo (teacher/student) são obrigatórios no body da requisição."
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
const questionId = '1234567890';

const response = await fetch(`http://localhost:3000/api/questions/${questionId}`, {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'João Silva',
    type: 'teacher'
  })
});

const data = await response.json();
```

---

### 6. POST /api/answers - Enviar Resposta (Apenas Student)

**Descrição:** Envia uma resposta para uma questão. Apenas usuários do tipo `student` podem responder.

**Método:** `POST`

**URL:** `/api/answers`

**Autenticação:** Requerida (envie `name` e `type` no body)

**Body (JSON):**
```json
{
  "name": "Maria Santos",
  "type": "student",
  "questionId": "1234567890",
  "answer": "Brasília"
}
```

**Campos:**
- `name` (string, obrigatório): Nome do student
- `type` (string, obrigatório): Deve ser `"student"`
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
  "error": "Nome e tipo (teacher/student) são obrigatórios no body da requisição."
}
```

ou

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
const response = await fetch('http://localhost:3000/api/answers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Maria Santos',
    type: 'student',
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

### 8. GET /api/users/me - Obter Informações do Usuário Atual (DEPRECADO)

**Descrição:** Este endpoint está deprecado. Como não é mais necessário fazer login, você já sabe o nome e tipo do usuário (você mesmo enviou). Não há necessidade de consultar este endpoint.

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

### 1. Tela de Entrada (Apenas Informar Nome e Tipo)

```javascript
// Usuário informa nome e tipo - NÃO precisa fazer login!
const handleEnter = (name, type) => {
  // Apenas salvar localmente para usar nas próximas requisições
  localStorage.setItem('userName', name);
  localStorage.setItem('userType', type);
  
  // Redirecionar para tela principal
  navigate('/dashboard');
};

// OU, se quiser validar no servidor (opcional):
const handleEnter = async (name, type) => {
  // Salvar localmente
  localStorage.setItem('userName', name);
  localStorage.setItem('userType', type);
  
  // Opcional: validar no servidor (não necessário)
  try {
    const response = await fetch('http://localhost:3000/api/users/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, type })
    });
    // ... tratamento de resposta
  } catch (error) {
    console.error('Erro:', error);
  }
  
  navigate('/dashboard');
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
  const name = localStorage.getItem('userName');
  const type = localStorage.getItem('userType');
  
  const response = await fetch('http://localhost:3000/api/questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      name, 
      type, 
      question, 
      options, 
      correctAnswer 
    })
  });
  
  const data = await response.json();
  if (data.success) {
    setQuestions(prev => [...prev, data.question]);
  }
};

// Deletar questão
const deleteQuestion = async (questionId) => {
  const name = localStorage.getItem('userName');
  const type = localStorage.getItem('userType');
  
  const response = await fetch(`http://localhost:3000/api/questions/${questionId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, type })
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
  const name = localStorage.getItem('userName');
  const type = localStorage.getItem('userType');
  
  const response = await fetch('http://localhost:3000/api/answers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      name, 
      type, 
      questionId, 
      answer 
    })
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
- `400` - Dados inválidos (name/type faltando, tipo inválido, etc.)
- `403` - Sem permissão (tipo de usuário incorreto - ex: student tentando criar questão)
- `404` - Recurso não encontrado (questão não existe)
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

1. **Autenticação:** NÃO é necessário fazer login! Apenas envie `name` e `type` no body de cada requisição que exige autenticação. O sistema criará ou encontrará o usuário automaticamente.

2. **Consistência:** O mesmo `name` + `type` sempre retornará o mesmo usuário, garantindo que respostas sejam associadas corretamente.

3. **Tempo Real:** Os endpoints REST não fornecem atualizações em tempo real. Para isso, use Socket.io (veja `INTEGRACAO_FRONTEND.md`) ou implemente polling (atualizar dados periodicamente).

4. **Polling:** Para simular tempo real com REST, você pode fazer requisições periódicas:
   ```javascript
   setInterval(async () => {
     const response = await fetch('http://localhost:3000/api/questions');
     const data = await response.json();
     setQuestions(data.questions);
   }, 2000); // Atualizar a cada 2 segundos
   ```

5. **Armazenamento:** Salve apenas `name` e `type` localmente (localStorage, sessionStorage, ou estado da aplicação). Não é necessário salvar `userId`.

6. **CORS:** O servidor está configurado para aceitar requisições de qualquer origem. Em produção, configure adequadamente.

7. **Sem Persistência:** Todos os dados são armazenados em memória. Ao reiniciar o servidor, tudo é perdido.

---

## Exemplo Completo (React Hook)

```javascript
import { useState, useEffect } from 'react';

function useTeacherApp() {
  const [userName, setUserName] = useState(localStorage.getItem('userName'));
  const [userType, setUserType] = useState(localStorage.getItem('userType'));
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  const API_BASE = 'http://localhost:3000/api';

  // Entrar no sistema (apenas salvar localmente)
  const enter = (name, type) => {
    localStorage.setItem('userName', name);
    localStorage.setItem('userType', type);
    setUserName(name);
    setUserType(type);
    return { name, type };
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name: userName, 
        type: userType, 
        question, 
        options, 
        correctAnswer 
      })
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name: userName, 
        type: userType, 
        questionId, 
        answer 
      })
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
    if (userName && userType) {
      loadQuestions();
      const interval = setInterval(loadQuestions, 2000);
      return () => clearInterval(interval);
    }
  }, [userName, userType]);

  return {
    userName,
    userType,
    questions,
    answers,
    enter,
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
