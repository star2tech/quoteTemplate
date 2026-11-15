const quoteInput = document.getElementById("quote-input");
const authorInput = document.getElementById("author-input");
const colorInput = document.getElementById("background-color");
const quotePreview = document.getElementById("quote-preview");
const authorPreview = document.getElementById("author-preview");
const quoteCard = document.getElementById("quote-card");
const characterCount = document.getElementById("character-count");
const hexValue = document.getElementById("hex-value");
const exportNote = document.getElementById("export-note");
const downloadButton = document.getElementById("download-button");
const swatches = Array.from(document.querySelectorAll(".swatch"));

const EMPTY_QUOTE = "Your words will live here.";
const EXPORT_WIDTH = 1200;
const EXPORT_HEIGHT = 1500;

function getCardInk(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((channel) => parseInt(channel, 16) / 255);
  const luminance = channels
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);

  return luminance < 0.36 ? "#f8f5ed" : "#1d2b37";
}

function updatePreview() {
  const quote = quoteInput.value.trim();
  const author = authorInput.value.trim();
  const color = colorInput.value;

  quotePreview.textContent = quote || EMPTY_QUOTE;
  quotePreview.style.opacity = quote ? "1" : "0.55";
  authorPreview.textContent = author;
  quoteCard.style.setProperty("--card-bg", color);
  quoteCard.style.setProperty("--card-ink", getCardInk(color));
  characterCount.textContent = `${quoteInput.value.length} / 500`;
  hexValue.textContent = color.toUpperCase();
  downloadButton.disabled = !quote;
  exportNote.textContent = quote
    ? "Ready to export · 1200 × 1500 px"
    : "Add a quote to create your card.";

  swatches.forEach((swatch) => {
    swatch.setAttribute("aria-pressed", swatch.dataset.color.toLowerCase() === color.toLowerCase());
  });

  fitPreviewQuote();
}

function wrapText(context, text, maxWidth) {
  const lines = [];
  const paragraphs = text.split(/\r?\n/);

  paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      lines.push("");
      return;
    }

    let line = "";
    paragraph.split(/\s+/).forEach((word) => {
      if (context.measureText(word).width > maxWidth) {
        if (line) {
          lines.push(line);
          line = "";
        }

        let chunk = "";
        Array.from(word).forEach((character) => {
          if (chunk && context.measureText(chunk + character).width > maxWidth) {
            lines.push(chunk);
            chunk = character;
          } else {
            chunk += character;
          }
        });
        line = chunk;
        return;
      }

      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });

    if (line) lines.push(line);
  });

  return lines;
}

function fitPreviewQuote() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const availableWidth = quotePreview.clientWidth;
  if (!context || !availableWidth) return;

  const text = quoteInput.value.trim() || EMPTY_QUOTE;
  const availableHeight = quoteCard.clientHeight * 0.47;
  let fontSize = 43;

  while (fontSize > 19) {
    context.font = `${fontSize}px "Instrument Serif", Georgia, "Times New Roman", serif`;
    const lineCount = wrapText(context, text, availableWidth).length;
    if (lineCount * fontSize * 1.08 <= availableHeight) break;
    fontSize -= 1;
  }

  quotePreview.style.fontSize = `${fontSize}px`;
}

function drawCard(context, quote, author, background) {
  const width = EXPORT_WIDTH;
  const height = EXPORT_HEIGHT;
  const ink = getCardInk(background);
  const inset = 36;

  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = `${ink}55`;
  context.lineWidth = 2;
  context.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  context.fillStyle = ink;
  context.globalAlpha = 0.72;
  context.font = '700 26px "DM Sans", "Segoe UI", sans-serif';
  context.textBaseline = "alphabetic";
  context.textAlign = "left";
  context.fillText("TinyQuotes", 96, 133);
  context.textAlign = "right";
  context.fillText("WORTH KEEPING", width - 96, 133);
  context.globalAlpha = 1;

  const displayQuote = quote || EMPTY_QUOTE;
  const textX = 105;
  const textWidth = width - 210;
  const quoteTop = 500;
  const quoteMaxHeight = 620;
  let fontSize = 102;
  let lines;

  while (fontSize > 21) {
    context.font = `${fontSize}px "Instrument Serif", Georgia, "Times New Roman", serif`;
    lines = wrapText(context, displayQuote, textWidth);
    if (lines.length * fontSize * 1.12 <= quoteMaxHeight) break;
    fontSize -= 2;
  }

  context.textAlign = "left";
  context.textBaseline = "top";
  context.globalAlpha = 0.62;
  context.font = '112px "Instrument Serif", Georgia, "Times New Roman", serif';
  context.fillText("“", textX, quoteTop - 112);
  context.globalAlpha = 1;
  context.font = `${fontSize}px "Instrument Serif", Georgia, "Times New Roman", serif`;
  context.fillStyle = ink;
  const lineHeight = fontSize * 1.12;
  lines.forEach((line, index) => {
    context.fillText(line, textX, quoteTop + index * lineHeight, textWidth);
  });

  const quoteBottom = quoteTop + lines.length * lineHeight;
  if (author) {
    const authorY = Math.min(Math.max(quoteBottom + 48, 1190), 1270);
    context.globalAlpha = 0.72;
    context.fillRect(textX, authorY - 5, 70, 2);
    context.globalAlpha = 1;
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.font = '700 25px "DM Sans", "Segoe UI", sans-serif';
    context.fillText(author.toUpperCase(), textX + 95, authorY, textWidth - 95);
  }

  context.globalAlpha = 0.7;
  context.textBaseline = "alphabetic";
  context.textAlign = "center";
  context.font = '700 22px "DM Sans", "Segoe UI", sans-serif';
  context.fillText("WORDS TO CARRY", width / 2, height - 90);
  context.globalAlpha = 0.55;
  context.fillRect(96, height - 96, 70, 2);
  context.fillRect(width - 166, height - 96, 70, 2);
  context.globalAlpha = 1;
}

async function downloadCard() {
  const quote = quoteInput.value.trim();
  if (!quote) {
    updatePreview();
    quoteInput.focus();
    return;
  }

  downloadButton.disabled = true;
  exportNote.textContent = "Preparing your card…";
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;

    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_WIDTH;
    canvas.height = EXPORT_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable in this browser.");

    drawCard(context, quote, authorInput.value.trim(), colorInput.value);
    const safeName = (authorInput.value.trim() || "quote")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);

    const link = document.createElement("a");
    link.download = `TinyQuotes-${safeName || "quote"}.png`;

    if (canvas.toBlob) {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("The card image could not be created."));
        }, "image/png");
      });
      const imageUrl = URL.createObjectURL(blob);
      link.href = imageUrl;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
    } else {
      link.href = canvas.toDataURL("image/png");
      link.click();
    }

    exportNote.textContent = "Your PNG is ready · 1200 × 1500 px";
  } catch (error) {
    exportNote.textContent = "Could not export this card. Please try again.";
    console.error(error);
  } finally {
    downloadButton.disabled = !quoteInput.value.trim();
  }
}

quoteInput.addEventListener("input", updatePreview);
authorInput.addEventListener("input", updatePreview);
colorInput.addEventListener("input", updatePreview);
colorInput.addEventListener("change", updatePreview);
downloadButton.addEventListener("click", downloadCard);
document.getElementById("quote-form").addEventListener("submit", (event) => {
  event.preventDefault();
  downloadCard();
});

swatches.forEach((swatch) => {
  swatch.addEventListener("click", () => {
    colorInput.value = swatch.dataset.color;
    updatePreview();
  });
});

window.addEventListener("resize", fitPreviewQuote);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(fitPreviewQuote);
}
updatePreview();
