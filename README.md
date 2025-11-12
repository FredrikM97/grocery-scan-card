# Shopping Scan List

## About

This is a plugin for home assistant to scan items with the barcode to add them to a shopping list. This plugin is based on the todo lists to store information so no other integration is needed.

**DISCLAMER**
This is very early development and I might rewrite everything again depending on the structure. This is in experimental phase to figure which direction I want to structure it in.

## Development

Simplest to UI test is to use `npm run setup` to start local docker container with home assistant. To update the card run `npm run build:ha`

## TODO

- Add groups to filter
- Somehow fix to select barcode from specific countries.. Like in sweden if barcode match with item in US then keep the swedish one
- Improve testing
- Add workflow for testing and release
- Add a test to verify that all translations are in sync.
- Improve readme and explain how the local setup of home assistant for testing works