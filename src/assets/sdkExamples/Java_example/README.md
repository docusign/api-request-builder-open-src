# Java JWT authentication code example

Repository: [eg-01-java-jwt](https://github.com/docusign/eg-01-java-jwt)

## Introduction

This software is an example of a **System Integration**.
This type of application interacts with DocuSign on its
own. There is no user interface and no user is present
during normal operation.

The application uses the OAuth JWT grant flow to impersonate
a user in the account.

This launcher example includes two examples:
1. Send an html, Word, and PDF file in an envelope to be signed.
1. List the envelopes in the account that changed in the last 30 days.

## Installation

Requirements: Java v1.7, v1.8 or later

### Short installation instructions
* Download or clone this repository.
* The project includes a Maven pom file.
* Configure the project's resource file:

  `eg-01-java-jwt/src/main/resources/config.properties`
  See the Configuration section, below,
  for more information.
* The project's main class is
  `Example`

### IntelliJ installation

See the [IntelliJ instructions](https://github.com/docusign/eg-01-java-jwt/blob/master/docs/Readme.IntelliJ.md).

## Configure the example

You can configure the example either via a properties file or via
environment variables:

*  **config.properties:** In the **src/main/resources/**
   directory, edit the `config.properties` file to update
   it with your settings.
   More information for the configuration settings is below.
*  Or via **environment variables:** export the needed
   environment variables.
   The variable names in the `config.properties` file
   are the same as the needed environment variables.

**Note:** do not store your Integration Key, private key, or other
private information in your code repository.

#### Creating the Integration Key
Your DocuSign Integration Key must be configured for a JWT OAuth authentication flow:
* Using the DocuSign Admin tool,
  create a public/private key pair for the integration key.
  Store the private key
  in a secure location. You can use a file or a key vault.
* The example requires the private key. Store the private key in the
  `config.properties` file or in the environment variable
  `DS_PRIVATE_KEY`.
* Due to Java handling of multi-line strings, add the
  text `\n\` at the end of each line of the private key.
  See the example in the `config.properties` file.
* If you will be using individual consent grants, you must create a
  `Redirect URI` for the key. Any URL can be used. By default, this
  example uses `https://www.docusign.com`

#### The impersonated user's guid
The JWT will impersonate a user within your account. The user can be
an individual or a user representing a group such as "HR".

The example needs the guid assigned to the user.
The guid value for each user in your account is available from
the DocuSign Admin tool in the **Users** section.

To see a user's guid, **Edit** the user's information.
On the **Edit User** screen, the guid for the user is shown as
the `API Username`.

## Run the examples

The project's main class is `Example`

### Consent
With JWT authentication, your application will **impersonate** a
DocuSign user in your account. To do so, your integration key
must gain the **consent** of the person who will be impersonated.
There are several methods availables:

1. Recommended: use the Organization Administration feature to
   preemptively grant consent. This technique requires that the
   account have Organization administration enabled and the
   email domain of the affected users must be claimed. SSO is
   not required.
1. Grant consent individually. Consent can be obtained for
   each user by having the user follow the first leg in the
   OAuth authorization code flow. The code example prints
   the url that should be used if consent is required.

## Support, Contributions, License

Submit support questions to [StackOverflow](https://stackoverflow.com). Use tag `docusignapi`.

Contributions via Pull Requests are appreciated.
All contributions must use the MIT License.

This repository uses the MIT license, see the
[LICENSE](https://github.com/docusign/eg-01-java-jwt/blob/master/LICENSE) file.
