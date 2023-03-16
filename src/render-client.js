import parseColor from "parse-color";
import * as functions from "./functions.js";

export default function renderClient(template, place, places, lookup, plaintext = false, rosae = window.rosaenlg_en_US) {
  try {
    let str = rosae.render(template, {
      place,
      places,
      lookup,
      ...functions,
      language: "en_US",
    });
    // Fix to remove spaces added between numbers and prefix/suffix symbols by rosae
    str = str.replace(/(?<=\d)\s+((?=%)|(?=p{2}))/g, "");
    str = str.replace(/(?<=[£€\$])\s+(?=\d)/g, "");
    // Fix to add spaces after closing </mark> </em> or <strong> tags unless followed by one of . , <
    str = str.replace(
      /((?<=<\/mark>)|(?<=<\/strong>)|(?<=<\/em>)|(?<=<\/[abi]>))(?![\.,<:;])/g,
      " "
    );
    if (!plaintext) {
      // Hack in ID labels
      let sections = str.match(/<section([^<]*?)>/g);
      sections = Array.isArray(sections)
        ? sections.filter((d, i, arr) => arr.indexOf(d) == i)
        : [];
      let ids = sections ? sections.map((s) => s.match(/id="([^<]*?)"/)) : [];
      let classes = sections
        ? sections.map((s) => s.match(/class="([^<]*?)"/))
        : [];
      sections.forEach((s, i) => {
        str = str.replaceAll(
          s,
          `${s}${
            classes[i]
              ? `<span class="class-label">${classes[i][1]}</span>`
              : ""
          }${ids[i] ? `<span class="id-label">id: ${ids[i][1]}</span>` : ""}`
        );
      });
      // Write in keys for custom props
      let props = str.match(/<prop([^<]*?)>/g);
      props = Array.isArray(props)
        ? props.filter((d, i, arr) => arr.indexOf(d) == i)
        : [];
      let prop_classes = props
        ? props.map((s) => s.match(/class="([^<]*?)"/))
        : [];
      props.forEach((p, i) => {
        str = str.replaceAll(p, `${p}${prop_classes[i][1]}: `);
      });
    }
    // Contrasting text colours for highlighted <mark> texts
    let marks = str.match(/<mark([^<]*?)>/g);
    if (Array.isArray(marks)) {
      marks = marks.filter(
        (d, i, arr) => arr.indexOf(d) == i && d.includes("background-color")
      );
      let colors = marks.map(
        (d) => d.match(/(?<=background-color:\s).+(?=[";])/)[0]
      );
      colors.forEach((color) => {
        let rgb = parseColor(color).rgb;
        let text_color =
          (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 125
            ? "black"
            : "white";
        str = str.replaceAll(
          `background-color: ${color}`,
          plaintext ? "" : `background-color: ${color}; color: ${text_color};`
        );
      });
    }
    return str;
  } catch (error) {
    console.warn(error);
    return "";
  }
}