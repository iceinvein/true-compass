#!/usr/bin/env node
import { render } from "ink";
import React from "react";
import DeployApp from "./deploy.js";

// Render the Ink app
render(React.createElement(DeployApp));
