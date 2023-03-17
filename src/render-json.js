import parseColor from "parse-color";
import * as functions from "./functions.js";

function parseClient(string) {
  let el = document.createElement('div');
  el.innerHTML = string;
  return el.firstChild;
}

// Cycle through LAs (and null for "no area selected")
export default function renderJSON(template, place, places, lookup, rosae = window.rosaenlg_en_US, parse = parseClient) {
  // Render PUG template with data for selected LA
  let sections_raw = rosae.render(template, {
    place,
    places,
    lookup,
    ...functions,
    language: "en_US",
  });
  // Fix to remove spaces added between numbers and prefix/suffix symbols by RosaeNLG
  sections_raw = sections_raw.replace(/(?<=\d)\s+((?=%)|(?=p{2}))/g, "");
  sections_raw = sections_raw.replace(/(?<=[£€\$])\s+(?=\d)/g, "");
  // Fix to add spaces after closing </mark> </em> or <strong> tags unless followed by one of . , <
  sections_raw = sections_raw.replace(
    /((?<=<\/span>)|(?<=<\/mark>)|(?<=<\/strong>)|(?<=<\/em>)|(?<=<\/[abi]>))(?![\.,<:;])/g,
    " "
  );

  // Process <mark> tags for text colour contrast
  // THIS OUGHT TO BE HANDLED IN THE HTML PARSER SECTION BELOW!!
  let marks = sections_raw.match(/<mark([^<]*?)>/g);
  if (Array.isArray(marks)) {
    marks = marks.filter(
      (d, i, arr) => arr.indexOf(d) == i && d.includes("background-color")
    );
    if (marks[0]) {
      let colors = marks.map(
        (d) => d.match(/(?<=background-color:\s).+(?=[";])/)[0]
      );
      colors.forEach((color) => {
        let rgb = parseColor(color).rgb;
        let text_color =
          (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 125
            ? "black"
            : "white";
        sections_raw = sections_raw.replaceAll(
          `background-color: ${color}`,
          `background-color: ${color}; color: ${text_color};`
        );
      });
    }
  }

  // Process HTML output of RosaeNLG into structured JSON
  let sections = [];
  let notes = [];
  let root = parse(sections_raw); // Convert HTML string into DOM-type object for parsing

  function parseSection(node) {
    let obj = {};
    if (node.getAttribute("id")) obj.id = node.getAttribute("id");
    if (node.getAttribute("class")) obj.type = node.getAttribute("class");
    let content = "";
    let subsections = [];

    // Loop through children (h2, p, subsections etc)
    node.childNodes.forEach((child) => {
      if (child.tagName == "SECTION") {
        subsections.push(child);
      } else if (child.tagName == "PROP" && child.getAttribute("class")) {
        let prop = child.getAttribute("class");
        let val =
          prop == child.innerText.includes("|") ?
            child.innerText.split("|") :
            child.innerText;
        obj[prop] = val;
      } else {
        content += child.outerHTML;
      }
    });
    if (content.length > 0) obj.content = content;

    // If there are sub-sections (eg. for scrollers), process these similarly sections
    // This could probably better be done recursively
    if (subsections[0]) {
      obj.sections = [];
      subsections.forEach((sub) => {
        obj.sections.push(parseSection(sub));
      })
    }
    return obj;
  }

  // Loop through main sections in the DOM and push them to the sections array
  if (root.childNodes.find(child => child.getAttribute && child.tagName !== "SECTION")) {
    // If the document is not structured in sections
    sections.push(parseSection(root));
  } else {
    root.childNodes.filter(child => child.getAttribute).forEach((node) => {
      sections.push(parseSection(node));
    });
  }

  // Push any top level HTML comments to the notes array
  root.childNodes.filter(child => !child.getAttribute).forEach((node) => {
    notes.push(node._rawText.replaceAll("<! --", "").replaceAll("-->", ""));
  });

  // Build the data object to be saved to JSON
  let data = { sections };
  if (place) data.place = place;
  if (place && place.regioncd && lookup[place.regioncd])
    data.region = lookup[place.regioncd];
  if (place && place.ctrycd && lookup[place.ctrycd])
    data.ctry = lookup[place.ctrycd];
  if (notes[0]) data.notes = notes;

  return data;
}
