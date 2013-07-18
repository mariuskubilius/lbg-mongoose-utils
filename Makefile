test:
	@./node_modules/.bin/mocha

test-cov: lib-cov
	@EXPRESS_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

.PHONY: test