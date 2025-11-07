# TODO
* Add groups to filter 
* Fix the support for products instead of only barcode
* Somehow fix to select barcode from specific countries.. Like in sweden if barcode match with item in US then keep the swedish one
* Improve testing
* Make the shopping list a popup instead to prevent bloating the UI
* Make camera optional so even if enabled then dont crash the UI if permissions not set. Just ignore until scan barcode is pressed
* Add workflow for testing and release
* Add Support for name - item count - barcode in todo to keep exact track of items
* Add support for dropdown for select entitiy instead of string 
* Fix bug where writing in card editor make you lose the focus directly after a letter.
* Make quick add only show top 15 of the most frequent used items.
* Improve error if invalid todo list selected to throw a more reasonable error
* Improve/fix the views to be more like predefined buttons instead of views to avoid confusion.
* Add a test to verify that all translations are in sync.
* Move the logic for translations to the translations folder instead of utils. 
* Clean upp product-lookup - Keeps track of too many things and better to separate the db api calls as different modules/classes to import
* Improve readme and explain how the local setup of home assistant for testing works
* Fix all the missing types on properties to prevent that ts cant find the declaration.
* Clean up barcode-card to do less logic and move logic into components/modules instead.
* Separate the scanning module (_startScanning) into separate module for better structure
* Also instead of extend HTMLElement extend LitElement and use Lit instead.