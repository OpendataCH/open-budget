## 🚧 No longer maintained 🚧

This is a community project which is looking for a new maintainre. You can find a list of other installations at https://make.opendata.ch/wiki/project:open_budget - check the other forks for code updates, and feel free to use the [Issue board](https://github.com/OpendataCH/open-budget/issues) or [our forums](https://forum.opendata.ch) to ask a question.

## Engineer: How to use
### Prerequisites
* ruby 1.9.3
* RubyGems
* Bundler

### We recommend RVM
* [see install documentation](https://rvm.io/rvm/install/)
* recommended params: `curl -#L https://get.rvm.io | bash -s stable --autolibs=3 --ruby=1.9.3`
* make sure to load rvm into your shell sessions: [RVM is not found...](https://rvm.io/support/faq/)

### No JS runtime installed?
* `bundle config --local without js`
* or use `therubyracer` but I haven't had time to test it

### Start the server
* `bundle install` (needs to run every time the Gemfile changes)
* `rails s thin`
* create your own data file in the format of public/data/bern/data.json
* send pull request with cool stuff

## Documentation
* [Wiki](https://github.com/tpreusse/open-budget/wiki)
* [Data Format](https://github.com/tpreusse/open-budget/wiki/Data-Format)
