# @onsvisual/robo-utils

[![npm version](https://badge.fury.io/js/@onsvisual%2Frobo-utils.svg)](https://www.npmjs.com/package/@onsvisual/robo-utils)

Utilities to make semi-automated journalism a bit easier. Can be used in any Javascript project (web browser or NodeJS) that is set up to use NPM packages.

Some simpler usage examples can be found in [this Svelte REPL](https://svelte.dev/repl/817f1d35fd1f40bf80005715f40faa07?version=4.2.9).

More complex usage examples (making use of PUG templates rendered to JSON files) can be found in the ONS [robo-article](https://github.com/ONSvisual/robo-article) and [robo-embed](https://github.com/ONSvisual/robo-embed) templates.

## Core Classes

### MagicNumber
Extends JavaScript's Number class with additional formatting and conversion methods.

**Methods:**
- `format(str = ",", si = "long")` - Format number with thousand separators and SI units
  - Input: Number, format string, SI unit style
  - Output: Formatted string (e.g., `1234` → `"1,234"`, `1000000` → `"1 million"`)
- `toWords(type = "cardinal", options = null)` - Convert to word representation
  - Input: Number, type ("cardinal"/"ordinal"), options object
  - Output: String (e.g., `5` → `"five"`, `21` → `"twenty-first"`)
- `abs()` - Return absolute value as MagicNumber
- `round(dp)` - Round to specified decimal places

### MagicArray
Extends JavaScript's Array class with data manipulation methods.

**Methods:**
- `sortBy(key, order = "ascending")` - Sort array by object property
  - Input: Property key, order ("ascending"/"descending")
  - Output: Sorted MagicArray
- `filterBy(key, val)` - Filter array by property value
  - Input: Property key, target value
  - Output: Filtered MagicArray
- `toList(key, separator = [", ", " and "])` - Convert to grammatical list
  - Input: Property key, separator array
  - Output: String (e.g., `["A", "B", "C"]` → `"A, B and C"`)
- `getRank(item, key, order = "descending")` - Get rank of item in sorted array
  - Input: Item object, sort key, order
  - Output: MagicNumber rank (1-indexed)
- `top(key, n = 1, add = null)` - Get top n items by key
  - Input: Sort key, number of items, optional additional items
  - Output: Single item or MagicArray
- `bottom(key, n = 1, add = null)` - Get bottom n items by key
- `between(key, start, end, mode = "rank", order = "descending", add = null, excludeTarget = false)` - get items between start and end, mode can be "rank", "value" or "around"
- `trim(n)` - Trim array to n items (positive from start, negative from end)
- `flip()` - Reverse array order


### MagicObject
Wrapper for objects with geographic/administrative data methods.

**Methods:**
- `getName(context = null, mode = "default")` - Get formatted name with context
  - Input: Context ("in"/"the"/"its"), mode
  - Output: Contextual name (e.g., `"in the North West"`, `"London's"`)
- `getCode()` - Extract area/region code
- `getCountry()` - Get country code from first character
- `getParent()` - Get parent area code
- `highest(keys)` - Given an array of `keys`, will return the key of the highest values. Recommended to use an object like a dictionary to lookup between column names and human readable titles. 
- `lowest(keys)` - Given an array of `keys`, will return the key of the lowest values. Recommended to use an object like a dictionary to lookup between column names and human readable titles. 

## Data Processing Functions

### csvParse(str, row = autoType)
Parse CSV string with automatic type detection.
- Input: CSV string, optional row processing function
- Output: Array of MagicObjects with typed values

### getData(url)
Fetch and parse CSV from URL.
- Input: URL string
- Output: Promise resolving to MagicArray

### autoType(object)
Convert object values to appropriate types (numbers to MagicNumber, arrays, dates).
- Input: Plain object
- Output: MagicObject with typed properties

## Formatting Functions

### format(val, str = ",", si = "long")
Format numbers with custom precision and SI units.
- Input: Number, format string, SI style
- Output: Formatted string
- Examples: 
  - `format(1234.56, ".1f")` → `"1234.6"`
  - `format(1000000, ".1s")` → `"1.0 million"`

### toWords(val, type = "cardinal", options = {})
Convert numbers to word representation.
- Input: Number, type, options object with `threshold` and `dropFirst`
- Output: String representation
- Examples:
  - `toWords(5)` → `"five"`
  - `toWords(21, "ordinal")` → `"twenty-first"`

### toList(array, key, separator = [", ", " and "])
Create grammatically correct lists from arrays.
- Input: Array, property key or function, separator configuration
- Output: Formatted list string
- Example: `["red", "green", "blue"]` → `"red, green and blue"`

## Geographic Functions

### formatName(name, context = null, mode = "default")
Format place names with appropriate articles and prepositions.
- Input: Place name, context ("in"/"the"/"its"), mode
- Output: Contextually formatted name
- Examples:
  - `formatName("North West", "in")` → `"in the North West"`
  - `formatName("London", "its")` → `"London's"`

### getName(place, context = null, mode = "default")
Extract and format name from place object.
- Input: Place object, context, mode
- Output: Formatted place name

### getCode(place) / getParent(place)
Extract codes from place objects using common key patterns.
- Input: Place object
- Output: Code string

## Utility Functions

### round(val, dp)
Round number to specified decimal places.
- Input: Number, decimal places
- Output: Rounded number

### abs(val)
Get absolute value as MagicNumber.
- Input: Number
- Output: MagicNumber

### moreLess(diff, texts = ["more", "less", "same"])
Get comparative text based on difference value.
- Input: Numeric difference, text array
- Output: Appropriate text ("more"/"less"/"same")

### breaksToWords(value, breaks = [0], texts = ["less", "more"], quantifier = null)
Convert values to descriptive text using breakpoints.
- Input: Value, breakpoint array, text labels, optional quantifier
- Output: Descriptive text based on value position

### capitalise(str)
Capitalize first letter of string.
- Input: String
- Output: Capitalized string

### pluralise(str, count = undefined)
Pluralise a word (eg. person => people). A word that is already plural will not change. If count (optional) is set to 1 then the singular will be returned, even if the input is plural.
- Input: String, count
- Output: Pluralised string

### singularise(str)
Singularise a word (eg. people => person). A word that is already singular will not change.
- Input: String
- Output: Singularised string

### aAn(str, mode = "default")
Add appropriate article ("a" or "an") to string.
- Input: String, mode
- Output: String with article or just article if mode !== "default"

## Data Transformation

### toData(arr, props, mode = null)
Transform array into structured data format.
- Input: Array, properties mapping object, mode ("protect"/"stringify"/null)
- Output: Transformed data array, JSON string, or protected JSON
- Used for creating chart data or API responses

## Array Manipulation

### ascending(a, b) / descending(a, b)
Comparison functions for sorting.
- Input: Two values to compare
- Output: Comparison result (-1, 0, 1, or NaN)

### addToArray(arr, items) / removeFromArray(arr, items)
Add or remove items from array based on code matching.
- Input: Array, items to add/remove
- Output: Modified array

## Template Rendering

### renderHTML(template, place, places, lookup, plaintext = false, pug = window.pug)
Render Pug template to HTML with data injection.
- Input: Pug template, place data, places array, lookup object, plaintext flag, Pug instance
- Output: Rendered HTML string with enhanced formatting

### renderJSON(template, place, places, lookup, pug = window.pug)
Render Pug template to structured JSON.
- Input: Pug template, place data, places array, lookup object, Pug instance
- Output: Structured JSON object with sections, place data, and metadata

# robo-utils Usage Examples

## Text and Number Formatting

### Converting Numbers to Words

```javascript
// Basic ordinal conversion
robo.toWords(10, "ordinal")
// Returns: "10th"

// Ordinal with dropFirst option
robo.toWords(1, "ordinal", {dropFirst: true})
// Returns: "" (empty string for first when dropped)

// Get rank as ordinal word
places.getRank(lookup["Birmingham"], "population_2011").toWords("ordinal")
// Returns: "first"
```

### Rounding Numbers

```javascript
// Round to 2 decimal places
robo.round(123.4567, 2)
// Returns: 123.46

// Round to nearest hundred (negative precision)
robo.round(123.4567, -2)
// Returns: 100
```

### Number Formatting

```javascript
// Format with comma separators and 2 decimal places
robo.format(1234.567, ',.2f')
// Returns: "1,234.57"

// Format with comma separators and round to hundreds
robo.format(1234.567, ',.-2f')
// Returns: "1,200"
```

## Data Analysis and Ranking

### Getting Top and Bottom Rankings

```javascript
// Get top 2 places by population, plus a specific place
places.top("population_2011", 2, lookup["Rutland"])
// Returns: [Birmingham_data, Leeds_data, Rutland_data]

// Get bottom 2 places by population, plus a specific place
places.bottom("population_2011", 2, lookup["Rutland"])
// Returns: [Rutland_data, City_of_London_data, Isles_of_Scilly_data]

// Get bottom 3 places, then remove one
places.bottom("population_2011", 3).remove(lookup["Isles of Scilly"])
// Returns: [West_Somerset_data, City_of_London_data]
```

### Getting things between
```javascript
// Get places ranked 5-10, with Rutland added and properly positioned
places.between("p2020", 5, 10, "rank", "descending", lookup["Rutland"])
  .toList("areanm")

// Get places around your area, with a comparison place properly ranked
places.between("p2020", place, 3, "around", "descending", lookup["Birmingham"])
  .toList("areanm")

// Get places between different values, here between 1/2 to 1 million
places.between("p2020",500000,1000000,"value")
  .toList("areanm")

// Get places around my area excluding my area itself
places.between("p2020",place,1,"around","descending",null,true)
  .toList('areanm')  
```

### Getting highest/lowest columns
```javascript
// Get the value of which ever is highest 
place[place.highest(["long_term_illness_2011_pc","unpaid_care_20_49_2011_pc"])]
  .format(",.0%")

// Use together with a dictionary
var dict = {"long_term_illness_2011_pc":"Long term illness", "unpaid_care_20_49_2011_pc":"unpaid care for those aged 20–49"}
In {place.getName()} the biggest health issue from census 2011 was {dict[place.highest(["long_term_illness_2011_pc","unpaid_care_20_49_2011_pc"])]} with a value of place[place.highest(["long_term_illness_2011_pc","unpaid_care_20_49_2011_pc"])]
  .format(",.0%")

```

### Converting to Chart Data

```javascript
// Convert top 3 places to chart-ready data format
places.top("population_2011", 3).toData({x: "population_2011", y: "areanm"})
// Returns: [
//   {x: birmingham_population, y: "Birmingham"},
//   {x: leeds_population, y: "Leeds"}, 
//   {x: sheffield_population, y: "Sheffield"}
// ]
```

## Comparative Analysis

### Break-point Analysis

```javascript
// Simple comparison (less than threshold)
robo.breaksToWords(-1)
// Returns: "less"

// Range-based comparison
robo.breaksToWords(5, [4, 6], ["less", "about the same", "more"])
// Returns: "about the same"

// Range-based comparison with qualifier
robo.breaksToWords(6, [4, 6], ["less", "about the same", "more"], "roughly")
// Returns: "roughly about the same"
```

## Name Formatting

### Possessive Forms

```javascript
// Format place names with possessive endings
robo.formatName("Derbyshire Dales", "its")
// Returns: "the Derbyshire Dales'" (handles names ending in 's' correctly)
```

## Common Patterns

### Data Pipeline Pattern

```javascript
// Typical data analysis workflow
const results = data
  .filter(d => /* filter criteria */)
  .sortBy("fieldName")
  .top("metricField", 5)
  .toData({x: "xField", y: "yField"});
```

### Narrative Generation Pattern

```javascript
// Generate descriptive text for rankings
const rank = places.getRank(lookup["SomePlace"], "population_2011");
const description = `${lookup["SomePlace"].areanm} ranks ${rank.toWords("ordinal")} by population`;
```

### Comparative Analysis Pattern

```javascript
// Compare values and generate descriptive text
const comparisonValue = someCalculation();
const description = robo.breaksToWords(
  comparisonValue, 
  [lowerBound, upperBound], 
  ["below average", "average", "above average"],
  "approximately"
);
```
