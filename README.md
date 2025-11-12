# GroceryScan Card

[![Home Assistant][ha-versions-shield]][homeassistant]
[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE.md)
![Downloads][downloads-shield]
[![Build Status][build-shield]][build]
[![Code Coverage][codecov-shield]][codecov]
[![Documentation Status][wiki-shield]][wiki]
[![Open in Dev Containers][devcontainer-shield]][devcontainer]

## About

This is a plugin for home assistant to scan items with the barcode to add them to a shopping list. This plugin is based on the todo lists to store information so no other integration is needed.

[![Add to HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=FredrikM97&repository=grocery-scan-card&categoryplugin)

**DISCLAMER**
This is very early development and I might rewrite everything again depending on the structure. This is in experimental phase to figure which direction I want to structure it in.

## Development

Simplest to UI test is to use `npm run setup` to start local docker container with home assistant. To update the card run `npm run build:ha`

[build-shield]: https://github.com/FredrikM97/grocery-scan-card/actions/workflows/test.yaml/badge.svg
[build]: https://github.com/FredrikM97/grocery-scan-card/actions
[codecov-shield]: https://codecov.io/gh/FredrikM97/grocery-scan-card/branch/dev/graph/badge.svg
[codecov]: https://codecov.io/gh/FredrikM97/grocery-scan-card
[license-shield]: https://img.shields.io/github/license/FredrikM97/grocery-scan-card.svg
[devcontainer-shield]: https://img.shields.io/static/v1?label=Dev%20Containers&message=Open&color=blue&logo=visualstudiocode
[devcontainer]: https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/FredrikM97/grocery-scan-card
[ha-versions-shield]: https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/FredrikM97/grocery-scan-card/main/hacs.json&label=homeassistant&query=$.homeassistant&color=blue&logo=homeassistant
[releases-shield]: https://img.shields.io/github/release/FredrikM97/grocery-scan-card.svg
[releases]: https://github.com/FredrikM97/grocery-scan-card/releases
[wiki-shield]: https://img.shields.io/badge/docs-wiki-blue.svg
[wiki]: https://github.com/FredrikM97/grocery-scan-card/wiki
[homeassistant]: https://my.home-assistant.io/redirect/hacs_repository/?owner=FredrikM97&repository=grocery-scan-card&category=plugin
[downloads-shield]: https://img.shields.io/github/downloads/FredrikM97/grocery-scan-card/total.svg
