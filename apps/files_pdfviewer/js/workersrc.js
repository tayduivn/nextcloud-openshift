/**
 * Checks if the page is displayed in an iframe. If not redirect to /.
 **/
function redirectIfNotDisplayedInFrame () {
	try {
		if (window.frameElement) {
			return;
		}
	} catch (e) {}

	window.location.href = '/';
}
redirectIfNotDisplayedInFrame();

// When "PDFViewerApplication.webViewerInitialized" is executed (once
// "PDFViewerApplication.initialize" is done) it opens the PDF file via URL,
// which requires the PDFViewerApplication to be properly configured, so the
// custom initialization has to be executed before that. This can be done by
// listening to the "webviewerloaded" event, which is emitted after
// "PDFViewerApplication" and "PDFViewerApplicationOptions" are globally set and
// before "PDFViewerApplication.initialize" is executed.
function initializeCustomPDFViewerApplication() {
	// Preferences override options, so they must be disabled for
	// "externalLinkTarget" to take effect.
	PDFViewerApplicationOptions.set('disablePreferences', true);
	PDFViewerApplicationOptions.set('externalLinkTarget', pdfjsLib.LinkTarget.BLANK);
	PDFViewerApplicationOptions.set('isEvalSupported', false);
	PDFViewerApplicationOptions.set('workerSrc', document.getElementsByTagName('head')[0].getAttribute('data-workersrc'));
	PDFViewerApplicationOptions.set('cMapUrl', document.getElementsByTagName('head')[0].getAttribute('data-cmapurl'));

	// The download has to be forced to use the URL of the file; by default
	// "PDFViewerApplication.download" uses a blob, but this causes a CSP error
	// (at least, in Firefox) when trying to download it.
	PDFViewerApplication.download = function() {
		// "isDataSchema()" and "getPDFFileNameFromURL()" are copied from
		// "vendor/pdfjs/web/viewer.js", as the functions defined in that file
		// can not be accessed from the outside.
		function isDataSchema(url) {
			var i = 0,
				ii = url.length;
			while (i < ii && url[i].trim() === '') {
				i++;
			}
			return url.substr(i, 5).toLowerCase() === 'data:';
		}

		function getPDFFileNameFromURL(url) {
			var defaultFilename = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'document.pdf';

			if (isDataSchema(url)) {
				console.warn('getPDFFileNameFromURL: ' + 'ignoring "data:" URL for performance reasons.');
				return defaultFilename;
			}
			var reURI = /^(?:(?:[^:]+:)?\/\/[^\/]+)?([^?#]*)(\?[^#]*)?(#.*)?$/;
			var reFilename = /[^\/?#=]+\.pdf\b(?!.*\.pdf\b)/i;
			var splitURI = reURI.exec(url);
			var suggestedFilename = reFilename.exec(splitURI[1]) || reFilename.exec(splitURI[2]) || reFilename.exec(splitURI[3]);
			if (suggestedFilename) {
				suggestedFilename = suggestedFilename[0];
				if (suggestedFilename.indexOf('%') !== -1) {
					try {
						suggestedFilename = reFilename.exec(decodeURIComponent(suggestedFilename))[0];
					} catch (ex) {}
				}
			}
			return suggestedFilename || defaultFilename;
		}

		var url = decodeURIComponent(window.location.search.substr(6));

		this.downloadManager.downloadUrl(url, getPDFFileNameFromURL(url));
	};
}

document.addEventListener('webviewerloaded', initializeCustomPDFViewerApplication, true);
