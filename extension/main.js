const extensionId = 'extension-utilities-1.0'.split('-')[1]; // this format is needed to set the Extension ID during install
const instance = easyeda.extension.instances[extensionId];
const manifest = instance.manifest;
const Helper = instance.Helper;

api('createCommand', {
  'extension-utilities-swap_ca_sr' : () => {
    swap_copperarea_solidregion();
  },
  'extension-utilities-github' : () => {
    window.open(manifest.homepage, '_blank');
  },
})

api('createToolbarButton', {
	icon: api('getRes', {file: 'icon.svg'}),
	title: 'Utilities',
	fordoctype: 'pcb,pcblib',
	menu:[
		{
			text: 'Swap Between Copper Area & Solid Region', 
			cmd: 'extension-utilities-swap_ca_sr', 
			title: 'Swap Between Copper Area & Solid Region',
			icon: api('getRes', {file: 'icon-swap-ca-sr.svg'})
    },
    {},
    {
			text: 'About', 
			cmd: 'extension-utilities-github', 
      title: 'Visit GitHub Page',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAFxSURBVHjajNPNK0RhFMfxe2dI04y8NExNNmzJ2igRWwtlRRllryz8DVhYiKLZaHbyWv4ALyHCgvwBQyEW5GVhphDfU7+rJ0n31Gfufe4959w7z3MfP1VX7/2KLgygHQ26doNDLGHXTfadBjWYxoj3fyxiHE82iDjFGyGKPeVsqMaLJuJxOy6gD0eYQhJVuMIjKnCOSdSiAylslvHTiWF1v8C8XrMaz7oenJfQioxq8tYga3OhxJJzvHde2z0PcqwmG1E3izfkQsxBTrkWGWuQ1uABhRANCsq1SFuDLw0SiIVoEFOuxZc1uNbAZrcnRIPuYAmt1hocaPCKGS2R/0ehr3vTzv19a5DXYBlb2MMx2pxim+ht7KBR1z6CZTzBHEbRi0s049Zp8KI94obVnAZ7wSZmBS0YU/EZPpWc1OxXaryOIRSDvVBEP9awqr+QdJ4WVbHlTWBQ5z97wdPTbKveaWnXna+uHE167Vm8B0XfAgwAj8RQQEL6HPwAAAAASUVORK5CYII='
		},
	]
});

Helper.checkUpdate();