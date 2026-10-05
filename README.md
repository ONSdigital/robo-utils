# @onsvisual/robo-utils

[![npm version](https://badge.fury.io/js/@onsvisual%2Frobo-utils.svg)](https://www.npmjs.com/package/@onsvisual/robo-utils)

A library of utilities to make Natural Language Generation (NLG) for semi-automated journalism a bit easier. Used in particular to produce local data-driven area reports in ONS products like [Housing prices in your area](https://www.ons.gov.uk/economy/inflationandpriceindices/articles/housingpricesinyourarea/2024-03-20), but can be included in any JavaScript project (web browser or Node.js) that is set up to use NPM packages.

It helps you to:

- load CSV data into arrays with methods for sorting, filtering, ranking and listing places
- format numbers, change, ranks, fractions, dates and place names as readable text
- render [Pug](https://pugjs.org) templates into structured JSON for each place

**[Read the API reference](docs/api.md)** for every function, with examples.

## Install

```bash
npm install @onsvisual/robo-utils
```

## Example

```js
import { MagicArray, csvParse } from "@onsvisual/robo-utils";

const csv = `areacd,areanm,pop_2011,pop_2021,pc_degree
E06000001,Hartlepool,92028,92338,0.21
E06000002,Middlesbrough,138412,143924,0.24
E06000003,Redcar and Cleveland,135177,136531,0.22
E06000004,Stockton-on-Tees,191610,196595,0.29
E06000005,Darlington,105564,107836,0.27`;

// Parse the CSV into a MagicArray of rows, with numbers converted to MagicNumbers
const places = MagicArray.from(csvParse(csv));

// Get a row by name or code
const place = places.get("Hartlepool");
```

Then write sentences about it:

```js
`${place.getName()} had a population of ${place.pop_2021.approx()} in 2021.`;
// "Hartlepool had a population of just over 92,000 in 2021."

`Its population ${place.pop_2011.describeChange(place.pop_2021)} from 2011.`;
// "Its population increased by 0.3% from 2011."

`It is ${places.getRankWithTies(place, "pop_2021").describe("largest")} area.`;
// "It is the fifth largest area."

`Around ${place.pc_degree.toFraction()} adults have a degree.`;
// "Around one in five adults have a degree."

`The largest areas are ${places.top("pop_2021", 3).toList("areanm")}.`;
// "The largest areas are Stockton-on-Tees, Middlesbrough and Redcar and Cleveland."
```

## Using Pug templates

`renderJSON` renders a [Pug](https://pugjs.org) template for one place, with all of the library's functions available, and converts the result into JSON for a front end to display. Each `section` becomes an object, and each `prop` element becomes a field, including chart data.

```pug
section#intro
  h2 Population #{place.getName("in")}
  p #{place.getName()} had a population of #{place.pop_2021.approx()} in 2021. It #{place.pop_2011.describeChange(place.pop_2021)} from 2011.
section#chart
  prop.title Largest local authorities
  prop.data= places.top("pop_2021", 3).toData({x: "pop_2021", y: "areanm"})
```

```js
import pug from "pug";
import { renderJSON } from "@onsvisual/robo-utils";

const output = renderJSON(template, place, places, places.lookup, pug);
```

```json
{
	"sections": [
		{
			"id": "intro",
			"content": "<h2>Population in Hartlepool</h2><p>Hartlepool had a population of just over 92,000 in 2021. It increased by 0.3% from 2011.</p>"
		},
		{
			"id": "chart",
			"title": "Largest local authorities",
			"data": [
				{ "x": 196595, "y": "Stockton-on-Tees" },
				{ "x": 143924, "y": "Middlesbrough" },
				{ "x": 136531, "y": "Redcar and Cleveland" }
			]
		}
	],
	"place": { "areacd": "E06000001", "areanm": "Hartlepool", "…": "…" }
}
```

See [renderJSON](docs/api.md#renderjson) for how templates are converted.

## More examples

- [Svelte REPL](https://svelte.dev/repl/817f1d35fd1f40bf80005715f40faa07?version=4.2.9) with some simple examples
- [robo-article](https://github.com/ONSvisual/robo-article) and [robo-embed](https://github.com/ONSvisual/robo-embed): ONS templates that render Pug templates to JSON files for each area
- [robo-editor](https://onsdigital.github.io/robo-editor/): try out Pug templates in your browser

## Development

```bash
npm install
npm test          # run the tests in watch mode
npm run lint      # check formatting
npm run format    # fix formatting
```
