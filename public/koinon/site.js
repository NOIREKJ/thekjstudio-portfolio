const navigation = document.querySelector(".product-nav");
const tabs = [...navigation.querySelectorAll("a")];
const panels = tabs.map(tab => document.getElementById(tab.hash.slice(1)));

function activate(index, moveFocus = false) {
  tabs.forEach((tab, i) => {
    const selected = i === index;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panels[i].hidden = !selected;
    if (!selected) panels[i].querySelector("video").pause();
  });
  if (moveFocus) tabs[index].focus();
}

navigation.setAttribute("role", "tablist");
tabs.forEach((tab, i) => {
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-controls", panels[i].id);
  panels[i].setAttribute("role", "tabpanel");
  panels[i].setAttribute("aria-labelledby", tab.id);
  panels[i].tabIndex = 0;
  tab.addEventListener("click", event => {
    event.preventDefault();
    history.replaceState(null, "", tab.hash);
    activate(i);
  });
});

function selectFromHash() {
  const selected = tabs.findIndex(tab => tab.hash === location.hash);
  if (selected !== -1) activate(selected);
  return selected;
}

if (selectFromHash() === -1) activate(0);
window.addEventListener("hashchange", selectFromHash);
navigation.addEventListener("keydown", event => {
  const index = tabs.indexOf(event.target);
  if (index === -1) return;
  const next = {
    ArrowLeft: (index + tabs.length - 1) % tabs.length,
    ArrowRight: (index + 1) % tabs.length,
    Home: 0,
    End: tabs.length - 1,
  }[event.key];
  if (next === undefined) return;
  event.preventDefault();
  history.replaceState(null, "", tabs[next].hash);
  activate(next, true);
});
