# Crawler API Document (base on Python)
## Required Packages
- BeautifulSoup
- lxml
- requests

## Usage
execute python script, `catalyst.py`, and give arguments to execute. The format is

```
python catalyst.py [module name] [portal username] [portal passwords] [arguments]
```

### Module name
Assignment a module to execute crawler. The module name can be the following:

Module name   | Features
------------- | ---------------------------------------------------------------------
login         | Login into portal, and return portal account verify result
userData      | Get any information about user. e.g. basic personal information
courseHistory | Get course record
course        | Get any information about user. e.g. homework or notification message

## login
Login into portal, and return portal account verify result

### arguments
no arguments.

## userData
Get any information about user. e.g. basic personal information

### arguments
no arguments.

## courseHistory
Get course record.

### arguments
no arguments.

## course

### arguments
`task` `arguments source` `arguments`

#### task
+ `homework` Get homework detail of specific course.


#### arguments source
+ `infile`

  Read a JSON format file as arguments. The JSON Format example:

  ```
  {
    "args": [
      {
        "year": 104,
        "semester": 1,
        "courseCode": "CS234",
        "class": "A"
      },
      {
        "year": 104,
        "semester": 1,
        "courseCode": "CS332",
        "class": "A"
      }
    ]
  }
  ```

+ `inline`
  Direct give arguments in command line. The Format is:
  ```
  [year] [semester] [courseCode] [class]
  ```
  The `year` is mean semester year, e.g. `104`.

  The `semester` is mean semester, e.g. `1`.

  The `courseCode` is mean a specific code of a course. e.g. `CS234`.

  The `class` is mean a specific class code. e.g. `A`, `A1`.
