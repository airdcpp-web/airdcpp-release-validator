import 'source-map-support/register';

import { ManagedExtension } from 'airdcpp-extension';
import Entry from './main';


// Entry point that is executed by the extension manager
//
// The file isn't executed when running development server so it shouldn't 
// generally contain any extension-specific code

// See https://github.com/airdcpp-web/airdcpp-extension-js for usage information
ManagedExtension(Entry, {
  // Possible custom options for airdcpp-apisocket can be listed here
});