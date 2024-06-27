import './style.css';

// Token pour l'API Météo Concept
const apiToken = 'c435ff34fc54d0cecfe276073173dc0be4a6d7564b7e9bd976cff4f7aab28647';

const initializeApp = () => {
  document.getElementById('sendButton').addEventListener('click', () => sendMessage());
  document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  document.getElementById('clearLocalStorage').addEventListener('click', clearLocalStorage);
  
  loadStoredMessages();
}

const sendMessage = () => {
  const messageInput = document.getElementById('messageInput');
  const messageText = messageInput.value.trim();

  if (messageText !== '') {
    const userMessage = { type: 'user', text: messageText };
    addMessageToChat(userMessage);

    if (messageText.startsWith('je veux les coordonnées géographique du code insee suivant ')) {
      const codeINSEE = messageText.substring('je veux les coordonnées géographique du code insee suivant '.length);
      fetchCityInfo(codeINSEE);
    } else if (messageText.startsWith('je veux les informations de la ville suivante ')) {
      const codePostal = messageText.substring('je veux les informations de la ville suivante '.length);
      fetchCityInfoByPostalCode(codePostal);
    } else if (messageText.toLowerCase() === 'je veux générer un utilisateur') {
      generateRandomUser();
    } else if (messageText.toLowerCase() === 'help') {
      displayHelp();
    } else {
      const botReply = { type: 'bot', text: 'Désolé, je ne comprends pas votre demande.' };
      addMessageToChat(botReply);
      saveMessage(userMessage, botReply);
    }

    messageInput.value = '';
  }
}

const addMessageToChat = (message) => {
  const messageElement = createMessageElement(message.text, message.type);
  document.getElementById('chatBox').appendChild(messageElement);
  document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;
}

const createMessageElement = (messageText, sender) => {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);

  if (sender === 'bot') {
    messageElement.innerHTML = messageText.replace(/\n/g, '<br>');
  } else {
    messageElement.textContent = messageText;
  }
  return messageElement;
}

const saveMessage = (userMessage, botReply) => {
  const messages = getStoredMessages();
  const timestamp = Date.now();
  messages[timestamp] = { userMessage, botReply };
  localStorage.setItem('chatMessages', JSON.stringify(messages));
}

const loadStoredMessages = () => {
  const messages = getStoredMessages();
  Object.values(messages).forEach(pair => {
    addMessageToChat(pair.userMessage);
    addMessageToChat(pair.botReply);
  });
}

const getStoredMessages = () => {
  const storedMessages = localStorage.getItem('chatMessages');
  return storedMessages ? JSON.parse(storedMessages) : {};
}

// API Météo Concep
const fetchCityInfo = async (codeINSEE) => {
  const apiUrl = `https://api.meteo-concept.com/api/location/city?token=${apiToken}&insee=${encodeURIComponent(codeINSEE)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données.');
    }
    const data = await response.json();
    const cityInfo = formatCityInfo(data);
    const botReply = { type: 'bot', text: cityInfo };
    addMessageToChat(botReply);
    saveMessage(codeINSEE, botReply);
  } catch (error) {
    console.error('Erreur API Météo Concept:', error.message);
    const errorMessage = 'Désolé, nous n\'avons pas pu récupérer les informations de la ville.';
    const botReply = { type: 'bot', text: errorMessage };
    addMessageToChat(botReply);
    saveMessage(codeINSEE, botReply);
  }
}

const formatCityInfo = (data) => {
  const { city } = data;
  const { latitude, longitude, altitude } = city;
  return `Coordonnées géographiques :\nLatitude: ${latitude}\nLongitude: ${longitude}\nAltitude: ${altitude} mètres.`;
}

// l'API Géo 
const fetchCityInfoByPostalCode = async (codePostal) => {
  const apiUrl = `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(codePostal)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données.');
    }
    const data = await response.json();
    if (data.length > 0) {
      const cityInfo = formatCityInfoByPostalCode(data[0]);
      const botReply = { type: 'bot', text: cityInfo };
      addMessageToChat(botReply);
      saveMessage(codePostal, botReply);
    } else {
      const errorMessage = 'Aucune ville trouvée pour ce code postal.';
      const botReply = { type: 'bot', text: errorMessage };
      addMessageToChat(botReply);
      saveMessage(codePostal, botReply);
    }
  } catch (error) {
    console.error('Erreur API Géo:', error.message);
    const errorMessage = 'Désolé, nous n\'avons pas pu récupérer les informations de la ville.';
    const botReply = { type: 'bot', text: errorMessage };
    addMessageToChat(botReply);
    saveMessage(codePostal, botReply);
  }
}

const formatCityInfoByPostalCode = (data) => {
  const { nom, code, codeDepartement, population } = data;
  return `Informations pour le code postal :\nNom de la ville : ${nom}\nCode INSEE : ${code}\nCode Département : ${codeDepartement}\nPopulation : ${population}`;
}
// randomuser
const generateRandomUser = async () => {
  const apiUrl = 'https://randomuser.me/api/';

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données.');
    }
    const data = await response.json();
    const userInfo = formatRandomUserInfo(data.results[0]);
    const botReply = { type: 'bot', text: userInfo };
    addMessageToChat(botReply);
    saveMessage('generateRandomUser', botReply);
  } catch (error) {
    console.error('Erreur API Random User:', error.message);
    const errorMessage = 'Désolé, nous n\'avons pas pu générer un utilisateur.';
    const botReply = { type: 'bot', text: errorMessage };
    addMessageToChat(botReply);
    saveMessage('generateRandomUser', botReply);
  }
}

const formatRandomUserInfo = (user) => {
  const { name, location, email, login, picture } = user;
  return `
    <div>
      <img src="${picture.large}" alt="User Picture" style="width:100px;height:100px;">
      <p>Nom : ${name.title} ${name.first} ${name.last}</p>
      <p>Adresse : ${location.street.number} ${location.street.name}, ${location.city}, ${location.state}, ${location.country}, ${location.postcode}</p>
      <p>Email : ${email}</p>
      <p>Pseudo : ${login.username}</p>
      <p>Mot de passe : ${login.password}</p>
    </div>
  `;
}

const displayHelp = () => {
  const helpMessage = `Commandes disponibles :
1. "je veux les coordonnées géographique du code insee suivant [code INSEE]" - Pour obtenir les coordonnées géographiques d'une ville par son code INSEE.
2. "je veux les informations de la ville suivante [code postal]" - Pour obtenir les informations sur une ville par son code postal.
3. "je veux générer un utilisateur" - Pour générer un utilisateur aléatoire avec ses informations.
4. "help" - Pour afficher ce message d'aide.`;

  const botReply = { type: 'bot', text: helpMessage };
  addMessageToChat(botReply);
  saveMessage('help', botReply);
}

const clearLocalStorage = () => {
  localStorage.removeItem('chatMessages');
  document.getElementById('chatBox').innerHTML = '';
}

document.addEventListener('DOMContentLoaded', initializeApp);
