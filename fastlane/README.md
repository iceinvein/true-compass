fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios upload_screenshots

```sh
[bundle exec] fastlane ios upload_screenshots
```

Upload screenshots to App Store Connect

### ios upload_metadata

```sh
[bundle exec] fastlane ios upload_metadata
```

Upload metadata only (no screenshots)

### ios upload_all

```sh
[bundle exec] fastlane ios upload_all
```

Upload both screenshots and metadata

### ios download_screenshots

```sh
[bundle exec] fastlane ios download_screenshots
```

Download existing screenshots from App Store Connect

### ios download_metadata

```sh
[bundle exec] fastlane ios download_metadata
```

Download existing metadata from App Store Connect

----


## Android

### android upload_screenshots

```sh
[bundle exec] fastlane android upload_screenshots
```

Upload screenshots and metadata to Google Play

### android upload_metadata

```sh
[bundle exec] fastlane android upload_metadata
```

Upload metadata only (no screenshots)

### android upload_all

```sh
[bundle exec] fastlane android upload_all
```

Upload both screenshots and metadata

### android download_metadata

```sh
[bundle exec] fastlane android download_metadata
```

Download existing metadata from Google Play

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
