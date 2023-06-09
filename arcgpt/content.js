///
/// Boost Source: https://arcboosts.com/boosts/85/arc-chat#code_block
///

const chatButton = document.createElement('button');
const chatContainer = document.createElement('div');
const chatBox = document.createElement('div');
const responseBox = document.createElement('div');
const info = document.createElement('p');
const chatAndInfo = document.createElement('div');
const contextOn = document.createElement('div');

chatButton.innerText = '💬';
chatButton.id = 'chatButton';

chatBox.innerHTML = `
      <button id="selectButton">✒</button>
      <button id="clearButton">🧹</button>
      <textarea rows="1" cols="50" id="chatInput"></textarea>
      <button id="sendButton">➤</button>
`;
chatBox.style.display = 'none';
chatBox.id = 'inputContainer';
chatContainer.className = 'chatContainer';

responseBox.id = 'outputContainer';
responseBox.style.display = 'none';

info.id = 'info';
info.style.display = 'none';

contextOn.id = 'context-toggle'
contextOn.innerHTML = `
  <p id="context-toggle">Read Page</p>
  <label class="switch">
    <input type="checkbox" id="read-page" checked>
    <span class="slider round"></span>
  </label>
`;
contextOn.style.display = 'none';

chatAndInfo.id = 'topRow';
chatAndInfo.appendChild(chatButton);
chatAndInfo.appendChild(info);
chatAndInfo.appendChild(contextOn);

chatContainer.appendChild(chatAndInfo);
chatContainer.appendChild(responseBox);
chatContainer.appendChild(chatBox);

document.body.insertBefore(chatContainer, document.body.firstChild);
const chatInput = document.querySelector('#chatInput');
const sendButton = document.querySelector('#sendButton');
const clearButton = document.querySelector('#clearButton');

let isChatBoxVisible = false;

// Expands button into window
chatButton.addEventListener('click', () => {
  if (isChatBoxVisible) {
    chatButton.innerHTML = "💬";
    chatBox.style.display = 'none';
    responseBox.style.display = 'none';
    info.style.display = 'none';
    contextOn.style.display = 'none';
  }
  else {
    chatButton.innerHTML = "X";
    info.style.display = 'flex';
    info.innerHTML = 'Ask a question to get started!'
    chatBox.style.display = 'flex';
    responseBox.style.display = 'flex';
    contextOn.style.display = 'flex';
    chatInput.focus();
  }
  isChatBoxVisible = !isChatBoxVisible;
});

let userInputs = [];
let assistantInputs = [];


// Listens for clicks on clean button, clean screen
let clearCheck = false;
clearButton.addEventListener('click', () => {
  if (clearCheck) {
    userInputs = [];
    assistantInputs = [];
    responseBox.innerHTML = "";
    clearButton.innerHTML = "🧹";
    info.innerHTML = 'Ask a question to get started!';
  }
  else {
    clearButton.innerHTML = "✓";
    info.innerHTML = "Click ✓ to confirm, anywhere else to cancel"
  }

  clearCheck = !clearCheck


});

// What are we listening for here?
document.addEventListener('click', (e) => {
  if (clearCheck && e.target.id !== "clearButton") {
    clearCheck = false;
    userInputs = [];
    assistantInputs = [];
    responseBox.innerHTML = "";
    clearButton.innerHTML = "🧹";
    info.innerHTML = 'Ask a question to get started!';
  }
})

// Expands input box
chatInput.addEventListener('input', () => {
  if (chatInput.scrollHeight >= 60) {
    chatInput.style.height = '60px'
  }
  else if (chatInput.scrollHeight >= 40) {
    chatInput.style.height = chatInput.scrollHeight + 'px';
  }
});


let selecting = false;
let selectedText = ""
const selectButton = document.querySelector('#selectButton');
selectButton.addEventListener('click', () => {
  if (selecting) {
    selectedText = window.getSelection().toString()
    let firstWord = selectedText.split(" ")[0];
    if (firstWord === "") {
      info.innerHTML = "Ask a question to get started!"
    }
    else {
      if (firstWord.length > 8) {
        firstWord = firstWord.slice(0, 8) + "...";
      }
      info.innerHTML = `Using selection starting with: ${firstWord}`
    }
    selectButton.innerHTML = "✒"
  }
  else {
    info.innerHTML = "Highlight text and confirm to choose context!"
    selectedText = ""
    selectButton.innerHTML = "✓"
  }
  selecting = !selecting
})


const handleChat = async () => {
  // Set your OpenAI API key
  const openaiApiKey = "OPENAI_API_KEY";
  if (openaiApiKey === "OPENAI_API_KEY") {
    info.innerHTML = "Oops, looks like you haven't entered your OpenAI API Key"
    return;
  }
  else {
    info.innerHTML = "Having a chat about this page!"
  }


  const userInput = document.getElementById("chatInput").value;
  document.getElementById("chatInput").value = "";
  const userElement = document.createElement('p');
  userElement.innerHTML = "User: ";
  userElement.innerHTML += userInput;
  userElement.className = "messageElement";
  responseBox.append(userElement);
  sendButton.disabled = true;
  let text = "";

  if (selectedText !== "") {
    text = selectedText
  }
  else {
    text = document.body.innerText;
  }

  const responseElement = document.createElement('p');
  responseElement.className = "messageElement";
  responseElement.innerHTML = "Thinking...";
  responseBox.append(responseElement);

  // Set up headers
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", `Bearer ${openaiApiKey}`);
  const messages = []

  if (!document.getElementById("read-page").checked) {
    messages.push(
      {
        role: "system",
        content: "You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible."
      }
    )
  } else {
    messages.push(
      {
        role: "system", content: `You are a helpful assistant named Archie, built as a Boost for the Arc Browser. 
      Your role is to answer questions relating in some way to the content on the web page that the user is currently on, or is currently highlighting.
      You only have available data from the page given in this system message, and are not able to search up additional information. 
      The following content represents the page the user is on, and any questions about the current webpage or website refer to that content.

      Page Content: 
      ${text}`
      })
  }

  const zipped = userInputs.map((element, index) => [element, assistantInputs[index]]);
  for (const [user, assistant] of zipped) {
    messages.push({ role: 'user', content: user },
      { role: 'assistant', content: assistant })
  }

  messages.push({ role: "user", content: userInput })
  userInputs.push(userInput)

  // Set up request body
  const requestBody = {
    model: "gpt-3.5-turbo",
    messages: messages,
  };

  // Send request to OpenAI GPT API
  fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    }
  )
    .then(
      res => {
        if (res.status === 400) {
          responseElement.innerHTML = "This page is too big! Use the highlight tool to select a smaller section"
          assistantInputs.push("<too_big_error>")
          return;
        }
        return res.json();
      })
    .then(json => {
      // handle response normally here
      let result = json;
      if (result.choices && result.choices.length > 0) {
        let textOutput = result.choices[0].message.content;
        if (responseElement.innerHTML === "Thinking...") {
          if (document.getElementById("read-page").checked) {
            response.innerHTML = "ChatGPT: ";
          } else {
            responseElement.innerHTML = "Archie: ";
          }
        }
        responseElement.innerHTML += textOutput;
        assistantInputs.push(textOutput);
        sendButton.disabled = false;
      }
    })
    .catch(error => {
      // Handle error
      if (responseElement.innerHTML !== "This page is too big! Use the highlight tool to select a smaller section") {
        console.log(error)
        responseElement.innerHTML = "Oops, that's an error. Try again!";
        assistantInputs.push("<error, ignore>");
      }
    })
}

sendButton.addEventListener('click', () => {
  if (chatInput.value !== "") {
    handleChat()

  }
});

chatInput.addEventListener('keydown', (event) => {
  if (chatInput.value !== "") {
    if (event.key === 'Enter') {
      handleChat()
    }
  }
});

chatInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    chatInput.value = "";
    chatInput.style.height = "";
  }
  else if (chatInput.value === "") {
    chatInput.style.height = "";
  }
});