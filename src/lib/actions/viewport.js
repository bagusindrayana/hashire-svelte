/**
 * @param {HTMLElement} node
 */
export function viewport(node) {
	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				node.classList.add('is-visible');
				observer.unobserve(node);
			}
		});
	}, { threshold: 0.1 });

	observer.observe(node);

	return {
		destroy() {
			observer.unobserve(node);
		}
	};
}