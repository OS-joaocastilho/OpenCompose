// Function to show the mini window with a smooth fade-in
function toggleWindow(visible, window) {
  if (visible) {
    // Show the mini-window
    window.style.display = "block";
    window.classList.add("show");
    adjustTextareaHeight()
  } else {
    // Hide the mini-window
    window.classList.remove("show");
    window.style.display = "none";
  }
}

// Draggable functionality for mini-window, excluding drags inside text areas
function makeDraggable(miniWindow) {
  let isDragging = false;
  let offsetX, offsetY;

  miniWindow.addEventListener("mousedown", (e) => {
    // Check if the click happened inside a text area; if so, don’t start dragging
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") {
      return;
    }

    isDragging = true;
    offsetX = e.clientX - miniWindow.offsetLeft;
    offsetY = e.clientY - miniWindow.offsetTop;
    document.body.style.cursor = "move";
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      miniWindow.style.left = `${e.clientX - offsetX}px`;
      miniWindow.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.cursor = "default";
  });
}

// Function to adjust the height of the textarea and the mini-window dynamically
function adjustTextareaHeight() {
  const textarea = document.getElementById("generateTextBox");
  const miniWindow = document.querySelector('.mini-window');

  // Reset the textarea height to auto to calculate the new scrollHeight
  textarea.style.height = 'auto';
  // Set the height of the textarea to its scrollHeight (height based on content)
  textarea.style.height = `${textarea.scrollHeight}px`;

  // Calculate the new height for the mini-window based on the textarea
  let newHeight = 120 + textarea.scrollHeight; // 160px is the initial height of the mini-window

  // Apply the new height to the mini-window
  miniWindow.style.height = `${newHeight}px`;
}

// Function to open the mini-window for settings
function initializeSettingsWindow() {
  // Create the settings mini window
  let settingsWindow = document.createElement("div");
  settingsWindow.classList.add("settings-window");
  settingsWindow.classList.add("window");

  // Retrieve stored endpoint and model (if available) from chrome.storage.sync
  chrome.storage.sync.get(['llmEndpoint', 'llmModel', 'apiKey'], function(items) {
    const endpoint = items.llmEndpoint || '';
    const model = items.llmModel || '';
    const api_key = items.apiKey || '';

    settingsWindow.innerHTML = `
      <div id="settingsWindow">
        <button class="closeButton closeButtonWindow" id="closeSettingsButton">&times;</button>
        <h2>Endpoint Settings</h2>
        <p class="description">
          The endpoint should be compatible with the OpenAI API Chat Completions schema.
        </p>
        <div class="settings-row">
          <label for="endpoint">Endpoint URL</label>
          <input id="endpoint" class="input settings-input" rows="1" value="${endpoint}" placeholder="Enter endpoint URL..."></textarea>
        </div>
        <div class="settings-row">
          <label for="model">Model Name</label>
          <input id="model" class="input settings-input" rows="1" value="${model}" placeholder="Enter model name...">
        </div>
        <div class="settings-row">
          <label for="api_key">OpenAI API Key</label>
          <input id="api_key" class="input settings-input" rows="1" value="${api_key}" placeholder="Enter OpenAI API Key. Leave empty if not needed..."></textarea>
        </div>
        <button class="blockButton" id="saveSettingsButton">Save</button>
      </div>
    `;

    // Append the settings window to the body
    document.body.appendChild(settingsWindow);

    // Event listener for saving the settings
    document.getElementById("saveSettingsButton").addEventListener("click", () => {
      const endpoint = document.getElementById("endpoint").value;
      const model = document.getElementById("model").value;
      const api_key = document.getElementById("api_key").value;

      // Store the settings in chrome.storage.sync
      chrome.storage.sync.set({ llmEndpoint: endpoint, llmModel: model, apiKey: api_key}, function() {
        console.log('Settings saved');
      });
      toggleWindow(false, settingsWindow)
    });

    document.getElementById("closeSettingsButton").addEventListener("click", () => {
      toggleWindow(false, settingsWindow)
    });
  });
  makeDraggable(settingsWindow);
}

function initializeGenerationWindow(targetElement) {
  let generationWindow = document.createElement("div");
  generationWindow.classList.add("generation-window", "window"); // Add your window styling
  generationWindow.style.display = "none"; // Initially hidden

  generationWindow.innerHTML = `
    <h2>Generated Response</h2>
    <div id="generationDisplay" class="generation-display"></div>
    <div class="generation-buttons">
      <button id="insertButton" class="blockButton generationButton" disabled>Insert</button>
      <button id="retryButton" class="blockButton generationButton">Retry</button>
      <button id="copyButton" class="blockButton generationButton" disabled>Copy</button>
    </div>
    <button class="closeButton closeButtonWindow">&times;</button>
  `;

  document.body.appendChild(generationWindow);

  const generation_display = document.getElementById("generationDisplay");
  const insert_button = document.getElementById("insertButton");
  const retry_button = document.getElementById("retryButton");
  const copy_button = document.getElementById("copyButton");

  // Helper to clear the generation display and reset buttons
  function resetGenerationUI() {
    generation_display.innerHTML = "";
    insert_button.disabled = true;
    copy_button.disabled = true;
  }

  // Helper to show the generation window
  function showGenerationWindow() {
    generationWindow.style.display = "block";
  }

  // Helper to hide the generation window
  function hideGenerationWindow() {
    generationWindow.style.display = "none";
  }

  // Helper to populate the generation text
  function displayGeneratedText(text) {
    generation_display.innerText = text;
    insert_button.disabled = false;
    copy_button.disabled = false;
  }

  // Insert button behavior
  insert_button.addEventListener("click", () => {
    if (targetElement.isContentEditable) {
      targetElement.innerText = generation_display.innerText;
    } else if (targetElement.value !== undefined) {
      targetElement.value = generation_display.innerText;
    }
    hideGenerationWindow();
  });

  // Retry button behavior
  retry_button.addEventListener("click", () => {
    const text_box = document.getElementById("generateTextBox");
    text_box.value = text_box.value || "Retrying with the last prompt...";
    document.getElementById("sendButton").click(); // Trigger a retry
  });

  // Copy button behavior
  copy_button.addEventListener("click", () => {
    navigator.clipboard.writeText(generation_display.innerText);
  });

  // Close button behavior
  generationWindow.querySelector(".closeButton").addEventListener("click", hideGenerationWindow);

  // Make the generation window draggable
  makeDraggable(generationWindow);

  return {
    show: showGenerationWindow,
    hide: hideGenerationWindow,
    reset: resetGenerationUI,
    displayText: displayGeneratedText,
  };
}


// Function to open the mini-window
function initializeMiniWindow(targetElement) {
  let miniWindow = document.createElement("div");
  miniWindow.classList.add("mini-window");
  miniWindow.classList.add("window");
  miniWindow.innerHTML = `
    <div id="generateMode" class="modeContainer">
      <h2>Compose</h2>
      <!--<div id="generationContainer" class="generation-container">
        <div id="generationDisplay" class="generation-display"></div>
        <div class="generation-buttons">
          <button id="insertButton" class="generation-button" disabled>Insert</button>
          <button id="retryButton" class="generation-button">Retry</button>
          <button id="copyButton" class="generation-button" disabled>Copy</button>
        </div>
      </div> -->
      <div class="input-container">
        <label id="infoMessage" for="generateTextBox">Default message</label><br>
        <textarea id="generateTextBox" class="input" rows="1" placeholder="Enter prompt for the LLM..."></textarea>
        <button class="blockButton" id="sendButton">Send</button>
      </div>
    </div>
    <button class="settings-button">⚙️</button>
    <button class="closeButton closeButtonWindow">&times;</button>
  `;
  document.body.appendChild(miniWindow);

  const generationUI = initializeGenerationWindow(targetElement);
  const text_box = document.getElementById("generateTextBox");
  const send_button = document.getElementById("sendButton");

  // Change button color based on text input
  text_box.addEventListener('input', function () {
    if (!text_box.value) {
      send_button.style.backgroundColor = "grey";
      send_button.style.color = "#ebebe4";
    } else {
      send_button.style.backgroundColor = "#28a745";
      send_button.style.color = "white";
    }
  });

  // Handle button click
  send_button.addEventListener("click", async () => {
    try {
      // Wrapping chrome.storage.sync.get in a Promise
      const items = await new Promise((resolve) => {
        chrome.storage.sync.get(['llmEndpoint', 'llmModel', 'apiKey'], resolve);
      });

      const promptText = text_box.value;
      const endpoint = items.llmEndpoint || '';
      const model = items.llmModel || '';
      const api_key = items.apiKey || '';
      const info_label = document.getElementById("infoMessage");

      info_label.style.visibility = "hidden";

      if (!promptText) return; // Don't send if the prompt is empty
      // Clear the textarea after sending the message
      generationUI.reset();
      generationUI.show();

      console.log("Prompt Text: " + promptText);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer ' + api_key
        },
        body: JSON.stringify({
          "model": model,
          "messages": [
            {
              "role": "system",
              "content": "You are a highly focused compose assistant. Your role is to assist the user in completing or generating text based on the provided context or prompts. Respond with clear, concise, and direct text that strictly fulfills the request, avoiding unnecessary explanations or alternative suggestions. Do not offer unsolicited advice or options; only address the task at hand. Always prioritize simplicity and relevance."
            },
            {
              "role": "user",
              "content": promptText
            }
          ],
          "stream": true
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let generatedText = "";


      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log(chunk);
        if (chunk.includes("<!DOCTYPE html>")) {
          console.warn("[OpenCompose] Error 404: Endpoint not found!");
          info_label.innerHTML = "Error 404: Endpoint not found!";
          info_label.style.color = "red";
          info_label.style.visibility = "visible";
          break;
        }
        const lines = chunk.trim().split('\n');
        for (const line of lines) {
          try {
              console.log("Line: " + line);
              const parsedData = JSON.parse(line);
              console.log(parsedData);
              const deltaContent = parsedData["message"]["content"] || "";
              generatedText += deltaContent;
              console.log("Display text: " + generatedText);
              generationUI.displayText(generatedText);
          } catch (parseError) {
            console.warn("[OpenCompose] Failed to parse JSON chunk:", line, parseError);
            info_label.innerHTML = "Failed to parse JSON chunk. Check the logs for more info.";
            info_label.style.color = "red";
            info_label.style.visibility = "visible";
            break;
          }
        }
      }
    } catch (error) {
      console.warn(error);
      const info_label = document.getElementById("infoMessage");
      info_label.innerHTML = "There was an error with the generation. Check the logs for more info.";
      info_label.style.color = "red";
      info_label.style.visibility = "visible";
    }
  });

  /*insert_button.addEventListener("click", () => {
    if (targetElement.isContentEditable) {
      targetElement.innerText = generation_display.innerText;
    } else if (targetElement.value !== undefined) {
      targetElement.value = generation_display.innerText;
    }
  });

  retry_button.addEventListener("click", () => {
    send_button.click(); // Trigger a retry
  });

  copy_button.addEventListener("click", () => {
    navigator.clipboard.writeText(generation_display.innerText).then(() => {
      alert("Copied to clipboard!");
    });
  });*/

  // Close button behavior
  miniWindow.querySelector('.closeButton').addEventListener('click', () => {
    toggleWindow(false, miniWindow);
  });



  miniWindow.querySelector('.settings-button').addEventListener('click', () => {
    const settingsWindow = document.querySelector(".settings-window");
    toggleWindow(true, settingsWindow);
  });

  // Make the mini window draggable
  makeDraggable(miniWindow);

  // Adjust textarea height dynamically
  const textarea = document.getElementById("generateTextBox");
  textarea.addEventListener('input', adjustTextareaHeight);

  adjustTextareaHeight();
}


// Function to detect the main editable area and create a single popup near it
function initializeMainPopup(target) {
  initializeMiniWindow(target);
  return createGrammarPopup(target);
}

// Function to observe for newly added text fields or dynamically changing elements on the page
function observeTextFieldFocus() {
  let currentPopup = null;

  document.addEventListener("focusin", (event) => {
    const target = event.target;

    // Check if the focused element is a div with contenteditable="true"
    if (target.matches("[contenteditable='true']")) {
      if (!currentPopup) {
        currentPopup = initializeMainPopup(target); // Pass the focused element to initializeMainPopup
      }
    }
  });

  document.addEventListener("focusout", (event) => {
    const target = event.target;
    const relatedTarget = event.relatedTarget;

    // Check if focus is moving outside the popup and targetElement
    if (
      currentPopup &&
      !currentPopup.contains(relatedTarget) && // Ensure relatedTarget is not within the popup
      !target.matches("[contenteditable='true']") // Ensure the original target is not focused
    ) {
      currentPopup.remove(); // Remove the popup
      currentPopup = null; // Reset the reference
    }
  });

}

// Function to create a single "Grammar Checker" popup near the main detected text field
function createGrammarPopup(targetElement) {
  // Check if the popup should be shown based on sessionStorage
  if (sessionStorage.getItem('popupClosed') === 'true') {
    return; // Prevent showing the popup if it was closed before in this session
  }

  // Create the popup container
  let popup = document.createElement("div");
  popup.classList.add("grammar-popup");
  popup.textContent = "OC";

  // Create the close button (X) to be positioned on the left
  let closeButton = document.createElement("button");
  closeButton.classList.add("closeButton");
  closeButton.classList.add("closeButtonPopup");
  closeButton.textContent = "X";

  // Show close button when hovering over the popup
  popup.addEventListener("mouseenter", () => {
    closeButton.style.display = "block";
  });

  // Hide close button when leaving the popup
  popup.addEventListener("mouseleave", () => {
    closeButton.style.display = "none";
  });

  // Add click event to remove the popup and set a flag to prevent it from appearing again
  closeButton.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent triggering the popup click event
    popup.remove();

    // Set a flag in sessionStorage so the popup won't show again in this session
    sessionStorage.setItem('popupClosed', 'true');
  });

  // Add click event to open the mini-window
  popup.addEventListener("click", () => {
    const miniWindow = document.querySelector(".mini-window");
    toggleWindow(true, miniWindow);
  });

  // Append the close button to the popup
  popup.appendChild(closeButton);

  // Position the popup relative to the target element
  //const rect = targetElement.getBoundingClientRect();
  //popup.style.top = `${rect.bottom}px`;
  //popup.style.left = `${rect.right - 50}px`;

  // Append the popup to the body
  document.body.appendChild(popup);

    // Position the popup relative to the target element
  function positionPopup() {
    const rect = targetElement.getBoundingClientRect();
    popup.style.position = "absolute"; // Relative to the scrolling page
    popup.style.top = `${window.scrollY + rect.bottom}px`; // Account for scrolling
    popup.style.left = `${window.scrollX + rect.right - popup.offsetWidth}px`; // Align to the right
  }

  // Initial position
  positionPopup();

  // Update position on scroll
  window.addEventListener("scroll", positionPopup, true);
  window.addEventListener("resize", positionPopup, true);

  return popup;
}

// On page load (refresh), make sure the sessionStorage is cleared correctly
window.addEventListener('load', () => {
  sessionStorage.removeItem('popupClosed');
  initializeSettingsWindow();
});

// Initialize the main popup when content.js loads
observeTextFieldFocus();
