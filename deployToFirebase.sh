#!/bin/bash

sh buildForFirebase.sh
firebase deploy
rm apps/dirIndexForFirebase.js
rm apps/index.html