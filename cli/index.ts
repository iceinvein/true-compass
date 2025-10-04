#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import DeployApp from './deploy.js';

// Render the Ink app
render(React.createElement(DeployApp));

