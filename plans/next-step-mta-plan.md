# Plan for Improving the Overall Performance of the System

## Notes

- 
- 
- 
- 

-------------------------------------------------
## Bugs

#### Priority Lv: P0

- [x] Fix the following packages compatibility warning which come when we run the command `expo start`, following best practices:
	```
	> expo start

	Starting project at /Users/ani/Developer/ANI/🍀 Projects&Orgs/1VibeCodeAI/AntiGravity/MovieTrackerApp
	React Compiler enabled
	Starting Metro Bundler
	The following packages should be updated for best compatibility with the installed expo version:
	  @types/jest@30.0.0 - expected version: 29.5.14
	  jest@30.2.0 - expected version: ~29.7.0
	Your project may not work correctly until you install the expected versions of the packages.

	```

- [x] Make a detailed summary report md file with all the issues, possible solutions, challenges faces etc in ./md-docs/reports/ following best practices

- [x] In `./services/analytics.ts` file fix this error:
	```
	Type 'number' is not assignable to type 'Timeout'.ts(2322)
	(property) AnalyticsService.sendTimer: NodeJS.Timeout | null
	```
- [] I think the TMDB API is not responding. Create a constants usage variable in .env file. Which can be set true/false accordingly. When set to true its will use the the data from the constants and ignore the API. Also update the codebase to be flexible to use any other API other than TMDB(Make a md doc on how to setup to match the keys based on fronted). Make these changes following best practices

- [] 
- [] 
- [] 


#### Priority Lv: P1
- []
- [] 
- [] 
- [] 


## Mobile View

#### Priority Lv: P0
- [] Make the app responsive.
- []
- []


#### Priority Lv: P1
- []
- []
- []


-------------------------------------------------
## New features

#### Priority Lv: P0
- []
- []
- []


#### Priority Lv: P1
- []
- []
- []

-------------------------------------------------
## To be done Manually

#### Priority Lv: P0
- [] 
- []
- []


#### Priority Lv: P1
- []
- []
- []

