const extensionId = "extension-utilities-id".split("-")[1]; // this format is needed to set the Extension ID during install
const instance = easyeda.extension.instances[extensionId];
const manifest = instance.manifest;
const Helper = instance.Helper;
const createCommand = Helper.createCommand;

api("createToolbarButton", {
  title: "Utilities",
  fordoctype: "pcb,pcblib",
  menu: [
		{
			text: "Create Rounded Rectangle from Rectangle",
			title: "Alt + R",
			icon: api("getRes", { file: "icon-create-round-rect.svg" }),
			cmd: createCommand(instance.util_create_rounded_rectangle),
		},
    {
      text: "Swap Between Copper Area & Solid Region",
      title: "Alt + C",
      icon: api("getRes", { file: "icon-swap-ca-sr.svg" }),
      cmd: createCommand(instance.util_swap_copperarea_solidregion),
    },
    {},
    {
      text: "About",
      title: "Visit GitHub Page",
      icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAFxSURBVHjajNPNK0RhFMfxe2dI04y8NExNNmzJ2igRWwtlRRllryz8DVhYiKLZaHbyWv4ALyHCgvwBQyEW5GVhphDfU7+rJ0n31Gfufe4959w7z3MfP1VX7/2KLgygHQ26doNDLGHXTfadBjWYxoj3fyxiHE82iDjFGyGKPeVsqMaLJuJxOy6gD0eYQhJVuMIjKnCOSdSiAylslvHTiWF1v8C8XrMaz7oenJfQioxq8tYga3OhxJJzvHde2z0PcqwmG1E3izfkQsxBTrkWGWuQ1uABhRANCsq1SFuDLw0SiIVoEFOuxZc1uNbAZrcnRIPuYAmt1hocaPCKGS2R/0ehr3vTzv19a5DXYBlb2MMx2pxim+ht7KBR1z6CZTzBHEbRi0s049Zp8KI94obVnAZ7wSZmBS0YU/EZPpWc1OxXaryOIRSDvVBEP9awqr+QdJ4WVbHlTWBQ5z97wdPTbKveaWnXna+uHE167Vm8B0XfAgwAj8RQQEL6HPwAAAAASUVORK5CYII=",
      cmd: createCommand(() => window.open(manifest.homepage, "_blank")),
    },
  ],
});

Helper.checkUpdate();

window.extension_reinstall ??= () => {
	api("doCommand", "extensionsSetting");
	document.querySelector(`[ext-id="${extensionId}"] [cmd="ext-remove"]`).click();
	document.querySelector('[i18n="Load Extension..."]').click();
	document.querySelector('[i18n="Select Files..."]').click();
};

document.querySelectorAll(".editframe").forEach(({ contentDocument }) =>
	contentDocument.addEventListener("keydown", ({ctrlKey, altKey, shiftKey, code}) => {
		if (!ctrlKey && altKey && !shiftKey && code === "KeyR") instance.util_create_rounded_rectangle()
		if (!ctrlKey && altKey && !shiftKey && code === "KeyC") instance.util_swap_copperarea_solidregion()
		if (ctrlKey && !altKey && shiftKey && code === "KeyR") window.extension_reinstall()
	})
);