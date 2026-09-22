const STATUS_LABEL = {
  idea: "Idea",
  capturing: "Capturing",
  ready: "Ready for Ink",
  editing: "Editing",
  published: "Published",
};

const $ = (sel) => document.querySelector(sel);

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function chip(status) {
  const extra = status && status !== "idea" ? status : "";
  return `<span class="chip ${extra}">${STATUS_LABEL[status] || status}</span>`;
}

function renderOverview(site, pipeline) {
  const counts = pipeline.topics.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    acc.total += 1;
    return acc;
  }, { total: 0 });
  const published = (pipeline.published || []).length;

  return `
    <h1>${site.name}</h1>
    <p class="lede">${site.tagline}</p>
    <div class="stats">
      <div class="stat"><b>${counts.total}</b><span>In pipeline</span></div>
      <div class="stat"><b>${counts.idea || 0}</b><span>Ideas</span></div>
      <div class="stat"><b>${published}</b><span>Published</span></div>
    </div>
    <div class="card">
      <h2>Ready for Ink</h2>
      ${(pipeline.handoffs || []).length
        ? (pipeline.handoffs || []).map((h) => `
            <div class="handoff">
              <div class="topic-title-row"><strong>${h.title}</strong> ${chip(h.status || "ready")}</div>
              <p class="muted">${h.notes || ""}</p>
              <ul>
                <li>File: <code>${h.file || ""}</code> (${h.size_mb || "?"} MB) — ${h.cam || ""}</li>
                <li><a href="${h.drive_file}" target="_blank" rel="noopener">Open video on Drive</a></li>
                <li><a href="${h.drive_folder}" target="_blank" rel="noopener">Open handoff folder</a></li>
              </ul>
            </div>`).join("")
        : `<p class="muted">No takes waiting yet.</p>`}
    </div>
    <div class="card">
      <h2>How this board works</h2>
      <p class="muted"><strong>Pipeline</strong> (left) = topics in flight. Each has an idea repo — notes, shot list, materials.</p>
      <p class="muted"><strong>Published</strong> (under pipeline) = already on YouTube for the public.</p>
      <p class="muted"><strong>Ready for Ink</strong> = capture packs on Drive for edit.</p>
      <p class="muted">Content brand: <strong>Mojo Dojo</strong>. Maker: <strong>${site.maker?.name || "Mojowerkin"}</strong>.</p>
    </div>
  `;
}

function renderAbout(site) {
  const roles = (site.about?.roles || [])
    .map((r) => `<div class="role"><strong>${r.who}</strong><span class="muted">${r.what}</span></div>`)
    .join("");
  const brand = site.brand || {};
  const seal = brand.shopSeal || "public/brand/shop-seal-light.png";
  const mark = brand.makerMark || "public/brand/maker-mark-light.png";
  return `
    <h1>About</h1>
    <p class="lede">${site.about?.blurb || ""}</p>
    <div class="card">
      <h2>Marks</h2>
      <div class="brand-lockup">
        <div>
          <img class="shop-seal" src="${seal}" alt="Mojo Dojo shop seal" />
          <p class="brand-caption">Shop seal — Mojo Dojo wordmark</p>
        </div>
        <div>
          <img class="maker-mark-lg" src="${mark}" alt="Mojowerkin maker mark" />
          <p class="brand-caption">Maker mark — craftsman’s stamp</p>
        </div>
      </div>
    </div>
    <div class="card">
      <h2>Roles</h2>
      <div class="role-grid">${roles}</div>
    </div>
    <div class="card">
      <h2>Public links</h2>
      <ul>
        <li>YouTube (${site.maker?.name || "Mojowerkin"}): <a href="${site.youtube.url}" target="_blank" rel="noopener">${site.youtube.handle}</a></li>
        <li>Discord: ${
          site.discord?.url
            ? `<a href="${site.discord.url}" target="_blank" rel="noopener">Join server</a>`
            : `<span class="muted">${site.discord?.note || "Invite TBD"}</span>`
        }</li>
      </ul>
    </div>
  `;
}

function renderTopic(meta, detail) {
  const ideas = (detail.ideas || []).map((i) => `<li>${i}</li>`).join("") || "<li class='muted'>No ideas yet</li>";
  const materials = (detail.materials || []).map((m) => `<li>${m}</li>`).join("") || "<li class='muted'>None listed</li>";
  const links = (detail.links || []).map((l) =>
    `<li><a href="${l.url}" target="_blank" rel="noopener">${l.label || l.url}</a></li>`
  ).join("") || "<li class='muted'>None yet</li>";

  return `
    <h1>${detail.title || meta.title}</h1>
    <p class="lede">${chip(detail.status || meta.status)} &nbsp; ${meta.summary || ""}</p>
    <div class="card">
      <h2>Idea repo</h2>
      <p>${detail.notes || ""}</p>
      <h3>Shot / episode ideas</h3>
      <ul>${ideas}</ul>
      <h3>Materials</h3>
      <ul>${materials}</ul>
      <h3>Links</h3>
      <ul>${links}</ul>
    </div>
  `;
}

function renderSidebar(pipeline, selectedId) {
  const list = $("#topic-list");
  list.innerHTML = pipeline.topics.map((t) => `
    <li>
      <button type="button" data-id="${t.id}" class="${t.id === selectedId ? "is-selected" : ""}">
        <div class="topic-title-row">
          <span>${t.title}</span>
          ${chip(t.status)}
        </div>
        <p class="topic-summary">${t.summary || ""}</p>
      </button>
    </li>
  `).join("");

  list.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      history.replaceState(null, "", `#topic/${btn.dataset.id}`);
      route();
    });
  });

  const pub = $("#published-list");
  const items = pipeline.published || [];
  if (!items.length) {
    pub.innerHTML = `<li><div class="empty">Nothing published yet — Mojo Dojo drops on YouTube land here.</div></li>`;
  } else {
    pub.innerHTML = items.map((p) => `
      <li>
        <a href="${p.url}" target="_blank" rel="noopener">
          ${p.title}
          <span class="pub-meta">${p.date || ""} · ${p.topic || ""}</span>
        </a>
      </li>
    `).join("");
  }
}

function setNav(active) {
  $("#nav-about").classList.toggle("is-active", active === "about");
}

let cache = { site: null, pipeline: null };

async function ensureData() {
  if (!cache.site) cache.site = await loadJSON("data/site.json");
  if (!cache.pipeline) cache.pipeline = await loadJSON("data/pipeline.json");
  return cache;
}

async function showTopic(pipeline, id) {
  const meta = pipeline.topics.find((t) => t.id === id);
  if (!meta) {
    $("#main").innerHTML = `<h1>Not found</h1><p class="muted">No topic “${id}”.</p>`;
    return;
  }
  const detail = await loadJSON(`data/${meta.ideasFile}`);
  $("#main").innerHTML = renderTopic(meta, detail);
  renderSidebar(pipeline, id);
  setNav(null);
}

async function route() {
  const { site, pipeline } = await ensureData();

  const discord = $("#nav-discord");
  if (site.discord?.url) {
    discord.href = site.discord.url;
    discord.textContent = "Discord";
    discord.onclick = null;
  } else {
    discord.removeAttribute("href");
    discord.title = site.discord?.note || "Invite TBD";
    discord.onclick = (e) => {
      e.preventDefault();
      history.replaceState(null, "", "#about");
      route();
    };
  }
  $("#nav-channel").href = site.youtube.url;

  const hash = location.hash.replace(/^#/, "");
  if (hash === "about") {
    $("#main").innerHTML = renderAbout(site);
    renderSidebar(pipeline, null);
    setNav("about");
    return;
  }
  const m = hash.match(/^topic\/(.+)$/);
  if (m) {
    await showTopic(pipeline, m[1]);
    return;
  }
  $("#main").innerHTML = renderOverview(site, pipeline);
  renderSidebar(pipeline, null);
  setNav(null);
}

$("#nav-about").addEventListener("click", () => {
  history.replaceState(null, "", "#about");
  route();
});
$("#brand-home").addEventListener("click", (e) => {
  e.preventDefault();
  history.replaceState(null, "", "#");
  route();
});
window.addEventListener("hashchange", route);

route().catch((err) => {
  $("#main").innerHTML = `<h1>Couldn’t load board</h1><p class="muted">${err.message}</p>`;
  console.error(err);
});
