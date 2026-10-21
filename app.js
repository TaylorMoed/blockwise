function loadBlocks() {
  try {
    const saved = localStorage.getItem("blockwise-blocks");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Could not load blocks:", error);
    return [];
  }
}

let blocks = loadBlocks();

const FIRST_ROW = 12;

function overlaps(a, b) {
  if (a.day !== b.day) return false;
  return (
    timeToRow(a.start) < timeToRow(b.end) &&
    timeToRow(b.start) < timeToRow(a.end)
  );
}

function timeToRow(time) {
  const parts = time.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  return hours * 2 + minutes / 30;
}

function render() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (const block of blocks) {
    const el = document.createElement("div");
    el.textContent = block.title;
    el.style.background = block.color;
    el.style.gridRow =
      timeToRow(block.start) -
      FIRST_ROW +
      1 +
      " / " +
      (timeToRow(block.end) - FIRST_ROW + 1);
    el.style.gridColumn = block.day + 1;
    el.addEventListener("click", function () {
      editingId = block.id;
      form.elements.title.value = block.title;
      form.elements.day.value = block.day;
      form.elements.start.value = block.start;
      form.elements.end.value = block.end;
      form.elements.color.value = block.color;
      dialog.showModal();
    });
    grid.append(el);
  }
}

let editingId = null;

render();

const dialog = document.querySelector("#block-dialog");
document.querySelector("#add-btn").addEventListener("click", () => {
  editingId = null;
  form.reset();
  dialog.showModal();
});

const form = document.querySelector("#block-form");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const block = {
    id: crypto.randomUUID(),
    title: data.get("title"),
    day: Number(data.get("day")),
    start: data.get("start"),
    end: data.get("end"),
    color: data.get("color"),
  };

  if (timeToRow(block.end) <= timeToRow(block.start)) {
    alert("End must be after start.");
    return;
  }
  if (blocks.some((b) => b.id !== editingId && overlaps(b, block))) {
    alert("That overlaps another block.");
    return;
  }

  if (editingId === null) {
    blocks.push(block);
  } else {
    blocks = blocks.map((b) =>
      b.id === editingId ? { ...block, id: editingId } : b,
    );
  }
  editingId = null;
  saveBlocks();
  render();
  form.reset();
  dialog.close();
});

document.querySelector("#delete-btn").addEventListener("click", () => {
  blocks = blocks.filter((b) => b.id !== editingId);
  saveBlocks();
  render();
  dialog.close();
});

document.querySelector("#grid").addEventListener("click", (event) => {
  if (event.target !== event.currentTarget) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const day = Math.floor((event.clientX - rect.left) / (rect.width / 7));
  const row =
    Math.floor((event.clientY - rect.top) / (rect.height / 36)) + FIRST_ROW;
  form.elements.day.value = day;
  form.elements.start.value = rowToTime(row);
  form.elements.end.value = rowToTime(row + 1);
  dialog.showModal();
});

function rowToTime(row) {
  const h = String(Math.floor(row / 2)).padStart(2, "0");
  const m = row % 2 == 0 ? "00" : "30";
  return h + ":" + m;
}

function saveBlocks() {
  localStorage.setItem("blockwise-blocks", JSON.stringify(blocks));
}

document.getElementById("clear-week").addEventListener("click", () => {
  if (!confirm("Clear all blocks for the week?")) return;
  blocks = [];
  saveBlocks();
  render();
});
