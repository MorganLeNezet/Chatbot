import './style.css'


// Token pour l'API Météo Concept
const apiToken = 'c435ff34fc54d0cecfe276073173dc0be4a6d7564b7e9bd976cff4f7aab28647';

const botNames = {
  meteo: 'MétéoBot',
  geo: 'GeoBot',
  randomUser: 'UserBot'
};

const initializeApp = () => {
  document.getElementById('sendButton').addEventListener('click', () => sendMessage());
  document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  document.getElementById('clearLocalStorage').addEventListener('click', clearLocalStorage);
  
  loadStoredMessages();
};

const sendMessage = () => {
  const messageInput = document.getElementById('messageInput');
  const messageText = messageInput.value.trim();

  if (messageText !== '') {
    const userMessage = { type: 'user', text: messageText };
    addMessageToChat(userMessage);


    if (messageText.startsWith('je veux les coordonnées géographique de ')) {
      const codeINSEE = messageText.substring('je veux les coordonnées géographique de '.length);
      fetchCityInfo(codeINSEE, userMessage);
    } else if (messageText.startsWith('je veux les informations de la ville suivante ')) {
      const codePostal = messageText.substring('je veux les informations de la ville suivante '.length);
      fetchCityInfoByPostalCode(codePostal, userMessage);
    } else if (messageText.toLowerCase() === 'je veux générer un utilisateur') {
      generateRandomUser(userMessage);
    } else if (messageText.toLowerCase() === 'je veux un utilisateur avec les mots de passe cryptée') {
      generateRandomUserWithEncryptedPasswords(userMessage);
    } else if (messageText.toLowerCase().startsWith('je veux générer ') && messageText.toLowerCase().includes(' utilisateurs')) {
      const numberOfUsers = parseInt(messageText.split(' ')[3], 10);
      if (!isNaN(numberOfUsers)) {
        generateMultipleRandomUsers(numberOfUsers, userMessage); 
      } else {
        const botReply = { type: 'bot', text: 'Veuillez spécifier un nombre valide.', botName: 'UserBot' };
        addMessageToChat(botReply);
        saveMessagePair(userMessage, botReply);
      }
    } else if (messageText.toLowerCase().startsWith('je veux connaitre l\'heure du lever et du couche de soleil de ')) {
      const codeINSEE = messageText.substring('je veux connaitre l\'heure du lever et du couche de soleil de '.length);
      fetchSunriseSunset(codeINSEE, userMessage);
    } else if (messageText.toLowerCase() === 'help') {
      displayHelp(userMessage);
    } else if (messageText.toLowerCase().startsWith('je veux connaitre la température de ')) {
      const codeINSEE = messageText.substring('je veux connaitre la température de '.length);
      fetchWeather(codeINSEE, userMessage);
    } else {
      const botReply = { type: 'bot', text: 'Désolé, je ne comprends pas votre demande. Tapez Help pour plus de renseignement', botName: 'HelperBot' };
      addMessageToChat(botReply);
      saveMessagePair(userMessage, botReply);
    }

    messageInput.value = '';
  }
};

const addMessageToChat = (message) => {
  const messageElement = createMessageElement(message.text, message.type, message.botName);
  document.getElementById('chatBox').appendChild(messageElement);
  document.getElementById('chatBox').scrollTop = document.getElementById('chatBox').scrollHeight;
};

const createMessageElement = (messageText, sender, botName = '') => {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);

  if (sender === 'bot') {
    const botNameElement = document.createElement('div');
    botNameElement.classList.add('bot-name');
    botNameElement.textContent = botName;
    messageElement.appendChild(botNameElement);
    messageElement.innerHTML += messageText.replace(/\n/g, '<br>');
  } else {
    messageElement.textContent = messageText;
  }

  return messageElement;
};

const saveMessagePair = (userMessage, botReply) => {
  const messages = getStoredMessages();
  const timestamp = Date.now();
  messages[timestamp] = { userMessage, botReply };
  localStorage.setItem('chatMessages', JSON.stringify(messages));
};

const loadStoredMessages = () => {
  const messages = getStoredMessages();
  Object.values(messages).forEach(pair => {
    addMessageToChat(pair.userMessage);
    addMessageToChat(pair.botReply);
  });
};

const getStoredMessages = () => {
  const storedMessages = localStorage.getItem('chatMessages');
  return storedMessages ? JSON.parse(storedMessages) : {};
};

const fetchCityInfo = async (codeINSEE, userMessage) => {
  const apiUrl = `https://api.meteo-concept.com/api/location/city?token=${apiToken}&insee=${encodeURIComponent(codeINSEE)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données.');
    }
    const data = await response.json();
    const cityInfo = formatCityInfo(data);
    const botReply = { type: 'bot', text: cityInfo, botName: botNames.meteo };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  } catch (error) {
    console.error('Erreur API Météo Concept:', error.message);
    const errorMessage = 'Désolé, nous n\'avons pas pu récupérer les informations de la ville.';
    const botReply = { type: 'bot', text: errorMessage, botName: botNames.meteo };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  }
};

const formatCityInfo = (data) => {
  const { city } = data;
  const { latitude, longitude, altitude } = city;
  return `Coordonnées géographiques :\nLatitude: ${latitude}\nLongitude: ${longitude}\nAltitude: ${altitude} mètres.`;
};

const fetchCityInfoByPostalCode = async (codePostal, userMessage) => {
  const apiUrl = `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(codePostal)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données.');
    }
    const data = await response.json();
    if (data.length > 0) {
      const cityInfo = formatCityInfoByPostalCode(data[0]);
      const botReply = { type: 'bot', text: cityInfo, botName: botNames.geo };
      addMessageToChat(botReply);
      saveMessagePair(userMessage, botReply);
    } else {
      const errorMessage = 'Aucune ville trouvée pour ce code postal.';
      const botReply = { type: 'bot', text: errorMessage, botName: botNames.geo };
      addMessageToChat(botReply);
      saveMessagePair(userMessage, botReply);
    }
  } catch (error) {
    console.error('Erreur API Géo:', error.message);
    const errorMessage = 'Désolé, nous n\'avons pas pu récupérer les informations de la ville.';
    const botReply = { type: 'bot', text: errorMessage, botName: botNames.geo };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  }
};

const formatCityInfoByPostalCode = (data) => {
  const { nom, code, codeDepartement, population } = data;
  return `Informations pour le code postal :\nNom de la ville : ${nom}\nCode INSEE : ${code}\nCode Département : ${codeDepartement}\nPopulation : ${population}`;
};

const fetchWeather = async (codeINSEE, userMessage) => {
  const apiUrl = `https://api.meteo-concept.com/api/forecast/daily/periods?token=${apiToken}&insee=${encodeURIComponent(codeINSEE)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données.');
    }
    const data = await response.json();
    const weatherInfo = formatWeatherInfo(data); 
    const botReply = { type: 'bot', text: weatherInfo, botName: botNames.meteo };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  } catch (error) {
    console.error('Erreur API Météo Concept:', error.message);
    const errorMessage = 'Désolé, nous n\'avons pas pu récupérer les informations météorologiques.';
    const botReply = { type: 'bot', text: errorMessage, botName: botNames.meteo };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  }
};


const formatWeatherInfo = (data) => {
  const now = new Date();
  const hour = now.getHours();

  let periodIndex;
  if (hour >= 6 && hour < 12) {
    periodIndex = 0; 
  } else if (hour >= 12 && hour < 18) {
    periodIndex = 1; 
  } else {
    periodIndex = 2; 
  }

  const { forecast } = data;
  const weatherData = forecast[0][periodIndex];
  const { temp2m } = weatherData;
  const periodName = getPeriodName(periodIndex);

  return `Température prévue pour ${periodName}: ${temp2m}°C`;
};


const getPeriodName = (periodIndex) => {
  switch (periodIndex) {
    case 0:
      return 'le matin';
    case 1:
      return 'l\'après-midi';
    case 2:
      return 'le soir / la nuit';
    default:
      return 'la période';
  }
};


const fetchSunriseSunset = async (codeINSEE, userMessage) => {
  const apiUrl = `https://api.meteo-concept.com/api/ephemeride/1?token=${apiToken}&insee=${encodeURIComponent(codeINSEE)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données.');
    }
    const data = await response.json();
    const sunrise = data.ephemeride.sunrise;
    const sunset = data.ephemeride.sunset;
    const botReply = { type: 'bot', text: `Heure du lever de soleil : ${sunrise}\nHeure du coucher de soleil : ${sunset}`, botName: botNames.meteo };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  } catch (error) {
    console.error('Erreur API Météo Concept:', error.message);
    const errorMessage = 'Désolé, nous n\'avons pas pu récupérer les informations de lever et coucher de soleil.';
    const botReply = { type: 'bot', text: errorMessage, botName: botNames.meteo };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  }
};

const generateRandomUser = async (userMessage) => {
  const apiUrl = 'https://randomuser.me/api/';

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données.');
    }
    const data = await response.json();
    const userInfo = formatRandomUserInfo(data.results[0]);
    const botReply = { type: 'bot', text: userInfo, botName: botNames.randomUser };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  } catch (error) {
    console.error('Erreur API Random User:', error.message);
    const errorMessage = 'Désolé, nous n\'avons pas pu générer d\'utilisateur.';
    const botReply = { type: 'bot', text: errorMessage, botName: botNames.randomUser };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  }
};


const generateRandomUserWithEncryptedPasswords = async (userMessage) => {
  const apiUrl = 'https://randomuser.me/api/?password=upper,8-16';

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données.');
    }
    const data = await response.json();
    const userInfo = formatRandomUserInfoWithEncryptedPasswords(data.results[0]);
    const botReply = { type: 'bot', text: userInfo, botName: botNames.randomUser };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  } catch (error) {
    console.error('Erreur API Random User:', error.message);
    const errorMessage = 'Désolé, nous n\'avons pas pu générer d\'utilisateur avec les mots de passe cryptés.';
    const botReply = { type: 'bot', text: errorMessage, botName: botNames.randomUser };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  }
};

const generateMultipleRandomUsers = async (numberOfUsers, userMessage) => {
  const apiUrl = `https://randomuser.me/api/?results=${encodeURIComponent(numberOfUsers)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des données.');
    }
    const data = await response.json();
    const userInfo = data.results.map(user => formatRandomUserInfo(user)).join('\n\n');
    const botReply = { type: 'bot', text: userInfo, botName: botNames.randomUser };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  } catch (error) {
    console.error('Erreur API Random User:', error.message);
    const errorMessage = 'Désolé, nous n\'avons pas pu générer des utilisateurs.';
    const botReply = { type: 'bot', text: errorMessage, botName: botNames.randomUser };
    addMessageToChat(botReply);
    saveMessagePair(userMessage, botReply);
  }
};

const formatRandomUserInfo = (user) => {
  const { name, location, email, login, picture } = user;
  return `
    <div>
      <img src="${picture.large}" alt="User Picture" style="width:100px;height:100px;">
      <p>Nom : ${name.title} ${name.first} ${name.last}</p>
      <p>Adresse : ${location.street.number} ${location.street.name}, ${location.city}, ${location.state}, ${location.country}, ${location.postcode}</p>
      <p>Email : ${email}</p>
      <p>Pseudo : ${login.username}</p>
    </div>
  `;
};

const formatRandomUserInfoWithEncryptedPasswords = (user) => {
  const { name, location, email, login, picture } = user;
  return `
    <div>
      <img src="${picture.large}" alt="User Picture" style="width:100px;height:100px;">
      <p>Nom : ${name.title} ${name.first} ${name.last}</p>
      <p>Adresse : ${location.street.number} ${location.street.name}, ${location.city}, ${location.state}, ${location.country}, ${location.postcode}</p>
      <p>Email : ${email}</p>
      <p>Pseudo : ${login.username}</p>
      <p>Mot de passe : ${login.password}</p>
      <p>Salt : ${login.salt}</p>
      <p>MD5 : ${login.md5}</p>
      <p>SHA-1 : ${login.sha1}</p>
      <p>SHA-256 : ${login.sha256}</p>
    </div>
  `;
};

const displayHelp = (userMessage) => {
  const helpMessage = `Commandes disponibles :
  
1. "je veux les coordonnées géographique de [code INSEE]" - Pour obtenir les coordonnées géographiques d'une ville par son code INSEE.
2. "je veux connaitre la température de [code INSEE]" - Pour obtenir la prévision de la température d'une ville par son code INSEE selon sa période actuelle.
3. "je veux connaitre l'heure du lever et du couche de soleil de [code INSEE]" - Pour obtenir l'heure du lever et du coucher de soleil d'une ville par son code INSEE.
4. "je veux les informations de la ville suivante [code postal]" - Pour obtenir les informations sur une ville par son code postal (utilité connaître le code INSEE de la ville ).
5. "je veux générer un utilisateur" - Pour générer un utilisateur aléatoire avec ses informations.
6. "je veux un utilisateur avec les mots de passe cryptée" - Pour générer un utilisateur aléatoire avec les mots de passe cryptés.
7. "je veux générer [nombre] utilisateurs" - Pour générer plusieurs utilisateurs aléatoires.
8. "help" - Pour afficher ce message d'aide.`;

  const botReply = { type: 'bot', text: helpMessage, botName: 'HelperBot' };
  addMessageToChat(botReply);
  saveMessagePair(userMessage, botReply);
};

const clearLocalStorage = () => {
  localStorage.removeItem('chatMessages');
  document.getElementById('chatBox').innerHTML = '';
};

document.addEventListener('DOMContentLoaded', initializeApp);
