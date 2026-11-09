# Changelog

## [1.24.0](https://github.com/abdullahmia/Compooss/compare/v1.23.0...v1.24.0) (2026-11-09)


### Features

* **desktop:** publish desktop installers as GitHub releases ([66bfed6](https://github.com/abdullahmia/Compooss/commit/66bfed6b4e73341cd5bab49d1fc981b5310c4a53))
* **desktop:** share one version between the web and desktop apps ([42af0ec](https://github.com/abdullahmia/Compooss/commit/42af0ecfec6a125774a61ce1077ea907a2438653))

## [1.23.0](https://github.com/abdullahmia/Compooss/compare/v1.22.0...v1.23.0) (2026-11-07)


### Features

* **desktop:** add a bun desktop menu for building and releasing ([76830a0](https://github.com/abdullahmia/Compooss/commit/76830a07942181dd259e7f78b8266b10b4f132f7))
* **desktop:** add a Tauri desktop app for macOS, Windows and Linux ([1e0bce9](https://github.com/abdullahmia/Compooss/commit/1e0bce96331918ad2be22dda575acd0ad919520a))
* **docs:** offer desktop app downloads on the landing page ([f4e1a7a](https://github.com/abdullahmia/Compooss/commit/f4e1a7a884a3c7aeeb66538eafdb68ccacd0c7e5))


### Bug Fixes

* align document fields in columns and remove the ER diagram ([86ba297](https://github.com/abdullahmia/Compooss/commit/86ba2972bccc4ce005d99cc5952904d0973d3cf3))
* **documents:** align the colon with field names and values ([3a9d28c](https://github.com/abdullahmia/Compooss/commit/3a9d28c83267e006872ac0f346dcb1944ce08233))


### Refactors

* **desktop:** drop the Linux AppImage and ship the .deb only ([4b31a80](https://github.com/abdullahmia/Compooss/commit/4b31a806ae549bfd8c8ad3dfe6d1e01fa3d0ddd5))

## [1.22.0](https://github.com/abdullahmia/Compooss/compare/v1.21.0...v1.22.0) (2026-11-04)


### Features

* add desktop app ([99d4dd2](https://github.com/abdullahmia/Compooss/commit/99d4dd21072272e7c2703019192f691348a75a17))
* **desktop:** add a Tauri desktop app for macOS, Windows and Linux ([487bf7a](https://github.com/abdullahmia/Compooss/commit/487bf7a82595795472f6a376ef04c7d71a2c7ac9))
* **docs:** offer desktop app downloads on the landing page ([71a5335](https://github.com/abdullahmia/Compooss/commit/71a5335340de281ad865ff0f9f4b28ea5d7eaea9))


### Bug Fixes

* **proxy:** check login on API paths that end in a file extension ([39cb92b](https://github.com/abdullahmia/Compooss/commit/39cb92b721c138b196c5e53f687d3b296d33b279))

## [1.21.0](https://github.com/abdullahmia/Compooss/compare/v1.20.0...v1.21.0) (2026-11-03)


### Features

* add collection tabs and a command palette ([daaa991](https://github.com/abdullahmia/Compooss/commit/daaa991fe0788cd8a1227665963871462a26eccd))
* add optional login, per-browser connections, and read-only mode ([a69a8e0](https://github.com/abdullahmia/Compooss/commit/a69a8e02c8fff6b5d06d71b956c03c1c651aab23))
* add query history, bulk update/delete, collection actions, and performance view ([84688ea](https://github.com/abdullahmia/Compooss/commit/84688eacfd38d2a5c66a669b84209ad40d7e892a))
* multi-user security, power-user workflows, and Docker connection fixes groups the work by theme ([b5ce34b](https://github.com/abdullahmia/Compooss/commit/b5ce34baeda96d81c88045db0366fb398ac90ed1))
* **sidebar:** make sidebar width resizable via drag handle ([d2ec2a8](https://github.com/abdullahmia/Compooss/commit/d2ec2a8034c27f3be3addb1c91f3c6fc98160f39))


### Bug Fixes

* **connection:** render status route at request time so connection persists on reload ([b5b5a66](https://github.com/abdullahmia/Compooss/commit/b5b5a66c589e1532915a023181a508d9c3c5f489))
* **connection:** resolve localhost URIs to the docker host when running in a container ([37aff48](https://github.com/abdullahmia/Compooss/commit/37aff48aebc5b771e5419df66ab05691809c84a2))
* **connection:** save connections when Compooss is opened over plain HTTP ([3b83bc4](https://github.com/abdullahmia/Compooss/commit/3b83bc4d8fd5ed52eb1c57853a989a2fc446f3d4))

## [1.20.0](https://github.com/abdullahmia/compooss/compare/v1.19.0...v1.20.0) (2026-06-27)


### Features

* **connection:** enhance ui and improve connection list ([c27464d](https://github.com/abdullahmia/compooss/commit/c27464dd0ee6294a10bbfacb6930479bdba74cd5))


### Bug Fixes

* **connection:** surface classified mongodb errors and fix state inconsistencies ([3352d3c](https://github.com/abdullahmia/compooss/commit/3352d3cd5ce23559218a168eca68acccac87bb27))

## [1.19.0](https://github.com/abdullahmia/compooss/compare/v1.18.0...v1.19.0) (2026-05-29)


### Features

* add circular reveal theme toggle to top bar ([6ce9420](https://github.com/abdullahmia/compooss/commit/6ce94207b388d8d39c0c9efe1debba90b688c394))
* add collection deletion functionality ([98138a7](https://github.com/abdullahmia/compooss/commit/98138a7afefd7c7e21298c1072ba00f2bb44f5a4))
* add collection export/import, dev seed script, and settings cle… ([305cd9a](https://github.com/abdullahmia/compooss/commit/305cd9a3bb24b845e541b5bde4c106def4fbd05f))
* add collection export/import, dev seed script, and settings cleanup ([d8f3cf9](https://github.com/abdullahmia/compooss/commit/d8f3cf931cdb43aa695010007e4faad2469eb76d))
* add collection stats retrieval and formatting for display in database service ([3324e2d](https://github.com/abdullahmia/compooss/commit/3324e2dfcb9fdee338b006b34de9e5c192033db3))
* add comparison table and "Why Compooss" section ([daa737c](https://github.com/abdullahmia/compooss/commit/daa737cd443353eb422c227cef46c1218dc2fcc8))
* add docs for compooss ([d98362c](https://github.com/abdullahmia/compooss/commit/d98362ce0e97437aba11e62b9489471e1587f36f))
* add docs for compooss ([66065a5](https://github.com/abdullahmia/compooss/commit/66065a5e31f4ce7b75ac93d0114844783ebfbdfd))
* add document deletion functionality and enhance JSON document component ([c7e1828](https://github.com/abdullahmia/compooss/commit/c7e1828a2e51ce73cf52643114709e3d7f343cba))
* add Extended JSON export modes and fix EJSON import/render ([9887baa](https://github.com/abdullahmia/compooss/commit/9887baa7e4b683ef017387ddabd81b3cf3a4cc2f))
* add Extended JSON export modes and fix EJSON import/render ([929317a](https://github.com/abdullahmia/compooss/commit/929317ab572d6b83244d2b33d6dfe413dead5dba))
* add interactive ER diagram and schema visualization ([eb92641](https://github.com/abdullahmia/compooss/commit/eb92641cd632d96f8b96dc6f14bb5f092e6c133a))
* add interactive ER diagram and schema visualization ([532dafb](https://github.com/abdullahmia/compooss/commit/532dafb73c4b3b6f95b58f539515b1c0033700a4))
* add JsonDocumentSkeleton component and improve loading state handling in DocumentsTab ([68df769](https://github.com/abdullahmia/compooss/commit/68df769e96afdd43099590f9a6ca0e5d22e69979))
* add light/dark/system theme switching with Monaco editor support ([b305c03](https://github.com/abdullahmia/compooss/commit/b305c03a063caefbe4bfeefb1209d1dbd1abb169))
* add light/dark/system theme switching with Monaco editor support ([4083884](https://github.com/abdullahmia/compooss/commit/40838846f3defca13f310d5de804b90490161e71))
* add multi-theme system with 8 skins and settings entry point ([80475fb](https://github.com/abdullahmia/compooss/commit/80475fbc16bd1bdefb173ceade34742c5034f659))
* add new database ([dee46f9](https://github.com/abdullahmia/compooss/commit/dee46f99a7d1b230235ff956203e69e3555d4204))
* add Pookie and Liquid Glass skins to the theme system ([495f8f7](https://github.com/abdullahmia/compooss/commit/495f8f75d6df63fdf9c051e4a8b219b72d729b13))
* add Storybook and Button component stories ([252f3a3](https://github.com/abdullahmia/compooss/commit/252f3a3b454a93ee1453710ff7057bfbc6daf866))
* add structured logging with pino across server and client ([27a007f](https://github.com/abdullahmia/compooss/commit/27a007f11170fb97a28f12bef2161a18eff766ac))
* added 404 for the docs ([47b5819](https://github.com/abdullahmia/compooss/commit/47b5819ad7739a1b0c19328c54189e431b705860))
* added api ([d351f35](https://github.com/abdullahmia/compooss/commit/d351f35c9d4969b7711be37a6028776d74e5207c))
* added db connection ([8cbe11d](https://github.com/abdullahmia/compooss/commit/8cbe11d7412195c58fac57d52d9801fb274cd08a))
* added edit document ([c2798dc](https://github.com/abdullahmia/compooss/commit/c2798dcec10b4874fe3131e0ff2cc092b0f3ecac))
* added issues for windows users on docs ([c06d6d3](https://github.com/abdullahmia/compooss/commit/c06d6d3af49b285f86a7a018af85c0af2adcd423))
* added multiple theme support ([19f5da1](https://github.com/abdullahmia/compooss/commit/19f5da1a5d8844ed9e2125c297d514c1fc3715a1))
* added multiple theme support ([bc86fb8](https://github.com/abdullahmia/compooss/commit/bc86fb8891612e7b63cad81ccdb395fe1ccd92a8))
* auto-retry localhost connections using mongo service name in docker ([e7b2cb0](https://github.com/abdullahmia/compooss/commit/e7b2cb0ae4fdc4a4ececfa186950980b2deef2e1))
* auto-retry localhost connections using mongo service name in Docker ([e5ac1da](https://github.com/abdullahmia/compooss/commit/e5ac1dafa20a09b31a134a83ce5b40db578dbb4f))
* **ci:** add label-gated deploy workflow and document CI labels ([b49736b](https://github.com/abdullahmia/compooss/commit/b49736b391e0a54f79e4d7a8c16ba931653ff0e2))
* **docs:** add GitHub link and author credit to landing page ([1d33655](https://github.com/abdullahmia/compooss/commit/1d3365505f67752820a5b8de320d5840941ba103))
* **docs:** redesign installation section and fix dev warnings ([819cef5](https://github.com/abdullahmia/compooss/commit/819cef55a3565b3b40e756eb19829f6cae8ea923))
* **docs:** redesign Why Compooss section ([f030f43](https://github.com/abdullahmia/compooss/commit/f030f435fadcbe7acda746b6cfc99e3f28310845))
* enhance connection form with error handling ([a34fc41](https://github.com/abdullahmia/compooss/commit/a34fc4130a4ff102d366f87dcff0c49dd4d80fee))
* enhance database page with loading skeletons and improve error handling in API routes ([466ff89](https://github.com/abdullahmia/compooss/commit/466ff89fc1a0d4961d67cc3a4d75494bdfb9fa9e))
* enhance document handling and add document insertion functionality ([6c069d2](https://github.com/abdullahmia/compooss/commit/6c069d242a44589b69b3d7519396db6bc132914c))
* enhance document update functionality and refactor document handling components ([0c93429](https://github.com/abdullahmia/compooss/commit/0c9342952ae867d9ace84043e87e266066ca611a))
* enhance playground layout with connection string display and loading state ([1127421](https://github.com/abdullahmia/compooss/commit/11274210ecde6bf90cd64a0d91cd7f08692c51d4))
* implement access control for protected databases ([3d1df5f](https://github.com/abdullahmia/compooss/commit/3d1df5fb34c043ec306e40efc30ebdcb9fd7b831))
* implement advanced document querying with filter, sort, and pagination support ([5435197](https://github.com/abdullahmia/compooss/commit/54351976fe4c84693e74b99b31d62611945177e4))
* implement collection creation functionality ([0957bc0](https://github.com/abdullahmia/compooss/commit/0957bc09c07c41808a08127ff2bd38c87f92baef))
* implement database deletion functionality ([9b7cd10](https://github.com/abdullahmia/compooss/commit/9b7cd1043fc9168d3be5016dde616f0c643f9652))
* implement full index management for collections in v1.2.0 ([4a790ac](https://github.com/abdullahmia/compooss/commit/4a790ac2534f8871d9ec074867f20e7b6dc989c9))
* implement full index management for collections in v1.2.0 ([303f489](https://github.com/abdullahmia/compooss/commit/303f48924da9c4e63b438526dd69820394eb26d8))
* implement loading skeletons for database and collection views t… ([7c178d6](https://github.com/abdullahmia/compooss/commit/7c178d68ff542e1561e027e10bbd73ec9f89b892))
* implement loading skeletons for database and collection views to improve user experience ([6cc9838](https://github.com/abdullahmia/compooss/commit/6cc983859f26bb790cf53d93e64cd8e9ea418304))
* improve error handling and user feedback for database connections in UI components ([4d4ad1e](https://github.com/abdullahmia/compooss/commit/4d4ad1ef9f426360617c5e217380f21c882fc8fb))
* improve shell UI, connection form UX, and sidebar collections ([ac39f60](https://github.com/abdullahmia/compooss/commit/ac39f60e45fee7e7ab39575d2c3041d901d5a5df))
* init bmad-method ([64afb03](https://github.com/abdullahmia/compooss/commit/64afb03899c2ba0b78bed2f9b43fcea86e9b288c))
* initial scaffold ([33eb842](https://github.com/abdullahmia/compooss/commit/33eb842b6e12c9872cd9b23674e4e51a9d643100))
* integrate api on database collections ([db9c46c](https://github.com/abdullahmia/compooss/commit/db9c46ceea10fd96d3583d812b348363aac97e47))
* integrate headers for connection health check in playground ([a906c8d](https://github.com/abdullahmia/compooss/commit/a906c8d50df443ecd992ca97b4a47d59dadc34ce))
* introduce schema analysis feature in v1.3.0, enhancing collecti… ([bfdf7d7](https://github.com/abdullahmia/compooss/commit/bfdf7d7abc3bde1567c9615683553b1df7dc9331))
* introduce schema analysis feature in v1.3.0, enhancing collection management ([07c6d29](https://github.com/abdullahmia/compooss/commit/07c6d29e6d0078a6927b92ea26d0fe70e8ffa630))
* introduce validation rules feature, allowing users to create, edit, and manage JSON Schema ([ffc966d](https://github.com/abdullahmia/compooss/commit/ffc966d9cd7ea1365fd96148c43bbf33d2948a0a))
* redesign connection page UI with glass effects and modern components ([5df7401](https://github.com/abdullahmia/compooss/commit/5df74015f4de764ce0a5320507baa3a414ac2915))
* redesign the connection page ([410252b](https://github.com/abdullahmia/compooss/commit/410252b881804bf1ffc527f159a80f60c1450be4))
* redesign the docs header ([08023b8](https://github.com/abdullahmia/compooss/commit/08023b82d86c392ccf458f839b6a924f2a52a793))
* redesign the landing page why compooss section ([abf7d4b](https://github.com/abdullahmia/compooss/commit/abf7d4b67be632038321cc1e2c04e2c3f0334a30))
* redesign the up coming & footer ([22ce189](https://github.com/abdullahmia/compooss/commit/22ce189e291b2bd77d260287d403c8b064236240))
* redesign the welcome screen ([6f8382a](https://github.com/abdullahmia/compooss/commit/6f8382a89f5dc26e2ff4df6b8e9c40d9c9602595))
* release aggregation pipelines feature ([dd89362](https://github.com/abdullahmia/compooss/commit/dd89362d22307a3d4fcebc3bda3650a7d4b2e84b))
* release multiple connections feature ([118dfee](https://github.com/abdullahmia/compooss/commit/118dfeeac6aadf85b130c0f73a067464666c37d3))
* release multiple connections feature ([83a9d99](https://github.com/abdullahmia/compooss/commit/83a9d99554a91ec47e953ffd800d4d0ac0827039))
* release v1.6.0 with embedded MongoDB shell feature, enhancing command execution capabilities ([29cd547](https://github.com/abdullahmia/compooss/commit/29cd5472d9cb193746a3eb2afb6a5c35d39e96d4))
* replace inline connection loader with animated FullPageLoader ([9cc1f37](https://github.com/abdullahmia/compooss/commit/9cc1f37ebce5c8e64c9ce4489dab35e42462d2eb))
* update Dockerfile for pnpm support ([1b21d9b](https://github.com/abdullahmia/compooss/commit/1b21d9b8cb06dec9426c13021d6db6f8bba546e2))
* update modal UI ([3151775](https://github.com/abdullahmia/compooss/commit/31517756d19cbdb99a4b84f82c87b1535ce940be))


### Bug Fixes

* add missing mutation argument to onSuccess callbacks in service hooks ([931875d](https://github.com/abdullahmia/compooss/commit/931875da333cd96517a5d6635b02e56e2cea4085))
* add multi-platform support for linux/amd64 and linux/arm64 ([e6e7d3b](https://github.com/abdullahmia/compooss/commit/e6e7d3b7617a2727bcf44836ed01bf44356abeee))
* added package manager in package.json ([efaec29](https://github.com/abdullahmia/compooss/commit/efaec29bc022e26c391c8a4df78bc9a69b637574))
* correct bun lockfile name in Dockerfile from bun.lockb to bun.lock ([9031715](https://github.com/abdullahmia/compooss/commit/90317155bc6da9a91e1d6e0c41de8de93838bb9c))
* correct bun lockfile name in Dockerfile from bun.lockb to bun.lock ([00bdeb1](https://github.com/abdullahmia/compooss/commit/00bdeb1ccd79b98da2038e9718c22c0c7bb97a53))
* correct shell input stale closures, clear command, and history nav ([e8cd0e2](https://github.com/abdullahmia/compooss/commit/e8cd0e251a261def04066cf7dedb72c8a24ee447))
* deployment issues ([387debd](https://github.com/abdullahmia/compooss/commit/387debdd6c04765aea7c5f69935d7fb22749d7a7))
* improve getDocumentId function to handle undefined and null _id cases ([6474f71](https://github.com/abdullahmia/compooss/commit/6474f71a046cee25ff721fa6952c6cb72dfe0982))
* prevent document mutations from skipping cache invalidation ([ad3a6da](https://github.com/abdullahmia/compooss/commit/ad3a6da20037f1fb56750c6ae81b2920753ed9d9))
* remove inputSize default to prevent padding leak on search variant ([8ec040a](https://github.com/abdullahmia/compooss/commit/8ec040a427f51f212a562f34daa68363601ac083))
* resolve the build issues ([cef79a2](https://github.com/abdullahmia/compooss/commit/cef79a2cc017d958148c069aca9874dcf576aa12))
* resolve the build issues ([f2d7a24](https://github.com/abdullahmia/compooss/commit/f2d7a245a34902fe9d35de997f938451c674f661))
* resolve type mismatch in optional-payload mutation hooks ([3268802](https://github.com/abdullahmia/compooss/commit/3268802b66f8ec02c50801053b2f51ee3f7bcb51))
* resolve type mismatch in optional-payload mutation hooks ([c59844e](https://github.com/abdullahmia/compooss/commit/c59844e4b8031a355c51c60b633e2fffefefe7b4))
* resolved documents counts for collections ([0811afc](https://github.com/abdullahmia/compooss/commit/0811afc10cb6cfb2c1c8b928b327fa392862edb1))
* resolved the release please warnings ([15d6a7f](https://github.com/abdullahmia/compooss/commit/15d6a7f29de664e475c5a47dff954e78caa04feb))
* suppress hydration warnings in layout component ([fda2d81](https://github.com/abdullahmia/compooss/commit/fda2d8190294f7f2c5616ec16d590ab03a0ccb77))
* update commit-msg hook to use bun instead of npx ([98a8317](https://github.com/abdullahmia/compooss/commit/98a8317422bd789fa0efc457fa06064503408093))
* validate db reachability before saving connection on connect ([e3fcefa](https://github.com/abdullahmia/compooss/commit/e3fcefafb95f4ce1ee19c87f9dea272c2d2f9cff))
* vertically center actions in connection card ([956c7b0](https://github.com/abdullahmia/compooss/commit/956c7b0278feaabafdca86403ac42c4403bf4de0))


### Refactors

* added favicon on the docs ([4cea890](https://github.com/abdullahmia/compooss/commit/4cea89011a357dc06a51e8dc78b67efd297bcc4f))
* added reuseable component ([6b2c12f](https://github.com/abdullahmia/compooss/commit/6b2c12fef1490ba6a63d1e286f737ff87956f904))
* code structure for improved readability and maintainability ([438e3dc](https://github.com/abdullahmia/compooss/commit/438e3dc815b1cf40e3fedf7df17f54d4a8f7a9a0))
* extract shared api-route helpers and standardise response format ([8e41164](https://github.com/abdullahmia/compooss/commit/8e41164fcc436fbb2d020ff4b37ad87d075e5e91))
* migrate components to lib/ and remove unused legacy code ([490668f](https://github.com/abdullahmia/compooss/commit/490668f1ba37f39f882c6381a55d9bce5e0d3012))
* refactor playground layout and shell components & add it with pages ([06111f2](https://github.com/abdullahmia/compooss/commit/06111f28dbd887be9c2a14333d591df86ccc765b))
* refactor the collection module ([5aec62b](https://github.com/abdullahmia/compooss/commit/5aec62bf5a4dbf4e297db4bf9380c2073f90d6d9))
* refactor the connection management ([f6769a1](https://github.com/abdullahmia/compooss/commit/f6769a1ce2cf8549ec2776050ac3c745522caf85))
* refactor the databased module ([5eb0f02](https://github.com/abdullahmia/compooss/commit/5eb0f028f54458a00c62f50dcadfa96e38d8bc2f))
* refactor the landing page ([c614f00](https://github.com/abdullahmia/compooss/commit/c614f006f50dd9eb842677dbb2c0daed1eca01ec))
* refactor the workspaces ([3524d1e](https://github.com/abdullahmia/compooss/commit/3524d1ea9a686cadf8b904d3f089498d1c265f27))
* remove playground components and related pages for cleanup ([3ea3db1](https://github.com/abdullahmia/compooss/commit/3ea3db1d638818670e76969ca63d42216d9ec3b0))
* remove Windows alert banner and related state management ([7be796c](https://github.com/abdullahmia/compooss/commit/7be796cb7100a46e427a5cb69878f021a2ab5edf))
* remove Windows alert banner and related state management ([86d8b92](https://github.com/abdullahmia/compooss/commit/86d8b921157211a66e7682b80bf10e49537174a6))
* rename lib/db to lib/storage and clean up MongoDriver ([5210468](https://github.com/abdullahmia/compooss/commit/5210468aa1231f6dc776d1e022073eb056529e8c))
* reorganize services by removing old implementations ([0677ad2](https://github.com/abdullahmia/compooss/commit/0677ad22cb8628c637a02491890895a3eec8503e))
* replace button elements with a unified Button component ([aef7668](https://github.com/abdullahmia/compooss/commit/aef7668ede1f10df1d4e04d588deacc22dca6a95))
* replace raw buttons with UI Button/IconButton across app ([aa3f850](https://github.com/abdullahmia/compooss/commit/aa3f850d82f4f8f8e5d82f8fbf12f81a716fd0b8))
* replace raw inputs and checkboxes with UI Input/Checkbox across app ([e71cbc1](https://github.com/abdullahmia/compooss/commit/e71cbc1e5c186473caa142aa50cd9750bf8d8eea))
* simplify NewConnection component and remove unused connection services ([9ff928c](https://github.com/abdullahmia/compooss/commit/9ff928c87a53a5406a9e56289ea8a90451a8bf97))
* simplify TopBar component and comment out unused features in WelcomeView ([88685db](https://github.com/abdullahmia/compooss/commit/88685db6bfac0c731b0bd1962e62b1c0ebdac45a))
* split landing page into section components and fix logger imports ([e1fbb67](https://github.com/abdullahmia/compooss/commit/e1fbb67de36977da1821deee3c17d9e847a37c5e))
* update readme and documentation to enhance feature description ([f2e77e8](https://github.com/abdullahmia/compooss/commit/f2e77e8781266c9c33b7d61ac72a269d8088fc6f))
* use relative /api base URL and drop .env.example ([eaec17c](https://github.com/abdullahmia/compooss/commit/eaec17c5a2cb81034749763941f3f3d46ea23fc0))


### Documentation

* add initial README and MIT license ([072c315](https://github.com/abdullahmia/compooss/commit/072c315b4184a8e7f3eb32c7e7039174f287e471))
* add project docs and move preview to docs directory ([e5edf7d](https://github.com/abdullahmia/compooss/commit/e5edf7d6947dfe85475876e000df7f930601c824))
* improve contributing guide, dev docs, and readme navigation ([08be280](https://github.com/abdullahmia/compooss/commit/08be280d2b3a94facfb2ed5c75a4b88eb76d95f2))
* improve contributing guide, dev docs, and readme navigation ([84ebc48](https://github.com/abdullahmia/compooss/commit/84ebc480367ba5209e46ce49c167e05d3bfdc6c6))
* overhaul README and contributor docs for open source release ([715a854](https://github.com/abdullahmia/compooss/commit/715a854d1c19ff7dce6c43a96a0c21b245920736))
* update author URL in README license section ([8fb5d4b](https://github.com/abdullahmia/compooss/commit/8fb5d4bf26ac5f6105be77a762cb072a86c5b84d))
* update the pull request template ([be239d2](https://github.com/abdullahmia/compooss/commit/be239d258b103fb1cbc8858bc9bf927bc7e7e928))

## [1.18.0](https://github.com/abdullahmia/compooss/compare/v1.17.0...v1.18.0) (2026-05-29)


### Features

* added multiple theme support ([a8d8d87](https://github.com/abdullahmia/compooss/commit/a8d8d87d1bf3430edc3faaadd583c9046e11d739))

## [1.17.0](https://github.com/abdullahmia/compooss/compare/v1.16.0...v1.17.0) (2026-05-29)


### Features

* add multi-theme system with 8 skins and settings entry point ([3f38aff](https://github.com/abdullahmia/compooss/commit/3f38aff69b8e67d9c8288fa104c298818c3d92a5))
* add Pookie and Liquid Glass skins to the theme system ([076410c](https://github.com/abdullahmia/compooss/commit/076410c01a3505571d64b00d662c9a67e5be234a))
* add structured logging with pino across server and client ([27a007f](https://github.com/abdullahmia/compooss/commit/27a007f11170fb97a28f12bef2161a18eff766ac))
* added multiple theme support ([f83cf98](https://github.com/abdullahmia/compooss/commit/f83cf98985c0114e3cf7108b28273640760f5880))
* redesign connection page UI with glass effects and modern components ([9b19724](https://github.com/abdullahmia/compooss/commit/9b1972461c3ad6324d1ae15e26a6356b97501b0d))
* redesign the landing page why compooss section ([abf7d4b](https://github.com/abdullahmia/compooss/commit/abf7d4b67be632038321cc1e2c04e2c3f0334a30))


### Refactors

* split landing page into section components and fix logger imports ([e1fbb67](https://github.com/abdullahmia/compooss/commit/e1fbb67de36977da1821deee3c17d9e847a37c5e))

## [1.16.0](https://github.com/abdullahmia/compooss/compare/v1.15.0...v1.16.0) (2026-05-19)


### Features

* auto-retry localhost connections using mongo service name in docker ([e01e248](https://github.com/abdullahmia/compooss/commit/e01e248d72b781d41bda88dfc9179d6bd4dae6d2))
* auto-retry localhost connections using mongo service name in Docker ([e5ac1da](https://github.com/abdullahmia/compooss/commit/e5ac1dafa20a09b31a134a83ce5b40db578dbb4f))

## [1.15.0](https://github.com/abdullahmia/compooss/compare/v1.14.0...v1.15.0) (2026-04-23)


### Features

* add circular reveal theme toggle to top bar ([6ce9420](https://github.com/abdullahmia/compooss/commit/6ce94207b388d8d39c0c9efe1debba90b688c394))
* improve shell UI, connection form UX, and sidebar collections ([ac39f60](https://github.com/abdullahmia/compooss/commit/ac39f60e45fee7e7ab39575d2c3041d901d5a5df))
* replace inline connection loader with animated FullPageLoader ([9cc1f37](https://github.com/abdullahmia/compooss/commit/9cc1f37ebce5c8e64c9ce4489dab35e42462d2eb))


### Bug Fixes

* correct shell input stale closures, clear command, and history nav ([e8cd0e2](https://github.com/abdullahmia/compooss/commit/e8cd0e251a261def04066cf7dedb72c8a24ee447))

## [1.14.0](https://github.com/abdullahmia/compooss/compare/v1.13.0...v1.14.0) (2026-04-20)


### Features

* add Extended JSON export modes and fix EJSON import/render ([cc9675b](https://github.com/abdullahmia/compooss/commit/cc9675bc23c55ddf2efbcafb52efd1cd66ab0c6c))
* add Extended JSON export modes and fix EJSON import/render ([929317a](https://github.com/abdullahmia/compooss/commit/929317ab572d6b83244d2b33d6dfe413dead5dba))


### Refactors

* refactor the landing page ([c614f00](https://github.com/abdullahmia/compooss/commit/c614f006f50dd9eb842677dbb2c0daed1eca01ec))

## [1.13.0](https://github.com/abdullahmia/compooss/compare/v1.12.1...v1.13.0) (2026-04-20)


### Features

* add interactive ER diagram and schema visualization ([6fa2371](https://github.com/abdullahmia/compooss/commit/6fa23716bf1e8a4113e6c7af89795821568159f1))
* add interactive ER diagram and schema visualization ([532dafb](https://github.com/abdullahmia/compooss/commit/532dafb73c4b3b6f95b58f539515b1c0033700a4))


### Bug Fixes

* improve getDocumentId function to handle undefined and null _id cases ([b7451ad](https://github.com/abdullahmia/compooss/commit/b7451ada2fff90b998dcb3905564e2fa9eecd7c5))
* update commit-msg hook to use bun instead of npx ([2579b46](https://github.com/abdullahmia/compooss/commit/2579b46e0997353dc7cfc583aa873f74098b9cb3))

## [1.12.1](https://github.com/abdullahmia/compooss/compare/v1.12.0...v1.12.1) (2026-04-17)


### Bug Fixes

* validate db reachability before saving connection on connect ([e3fcefa](https://github.com/abdullahmia/compooss/commit/e3fcefafb95f4ce1ee19c87f9dea272c2d2f9cff))


### Refactors

* remove Windows alert banner and related state management ([71c02c8](https://github.com/abdullahmia/compooss/commit/71c02c8819bd8b6a689886d1dd1f4f2ef6ed609b))
* remove Windows alert banner and related state management ([86d8b92](https://github.com/abdullahmia/compooss/commit/86d8b921157211a66e7682b80bf10e49537174a6))

## [1.12.0](https://github.com/abdullahmia/compooss/compare/v1.11.1...v1.12.0) (2026-04-13)


### Features

* add collection export/import, dev seed script, and settings cle… ([305cd9a](https://github.com/abdullahmia/compooss/commit/305cd9a3bb24b845e541b5bde4c106def4fbd05f))
* add collection export/import, dev seed script, and settings cleanup ([d8f3cf9](https://github.com/abdullahmia/compooss/commit/d8f3cf931cdb43aa695010007e4faad2469eb76d))

## [1.11.1](https://github.com/abdullahmia/compooss/compare/v1.11.0...v1.11.1) (2026-04-13)


### Bug Fixes

* resolve the build issues ([cef79a2](https://github.com/abdullahmia/compooss/commit/cef79a2cc017d958148c069aca9874dcf576aa12))
* resolve the build issues ([f2d7a24](https://github.com/abdullahmia/compooss/commit/f2d7a245a34902fe9d35de997f938451c674f661))

## [1.11.0](https://github.com/abdullahmia/compooss/compare/v1.10.0...v1.11.0) (2026-04-13)


### Features

* add light/dark/system theme switching with Monaco editor support ([b305c03](https://github.com/abdullahmia/compooss/commit/b305c03a063caefbe4bfeefb1209d1dbd1abb169))
* add light/dark/system theme switching with Monaco editor support ([4083884](https://github.com/abdullahmia/compooss/commit/40838846f3defca13f310d5de804b90490161e71))

## [1.10.0](https://github.com/abdullahmia/compooss/compare/v1.9.0...v1.10.0) (2026-04-11)


### Features

* **ci:** add label-gated deploy workflow and document CI labels ([b49736b](https://github.com/abdullahmia/compooss/commit/b49736b391e0a54f79e4d7a8c16ba931653ff0e2))
* **docs:** redesign installation section and fix dev warnings ([819cef5](https://github.com/abdullahmia/compooss/commit/819cef55a3565b3b40e756eb19829f6cae8ea923))
* **docs:** redesign Why Compooss section ([f030f43](https://github.com/abdullahmia/compooss/commit/f030f435fadcbe7acda746b6cfc99e3f28310845))

## [1.9.0](https://github.com/abdullahmia/compooss/compare/v1.8.1...v1.9.0) (2026-04-11)


### Features

* **docs:** add GitHub link and author credit to landing page ([1d33655](https://github.com/abdullahmia/compooss/commit/1d3365505f67752820a5b8de320d5840941ba103))


### Bug Fixes

* remove inputSize default to prevent padding leak on search variant ([8ec040a](https://github.com/abdullahmia/compooss/commit/8ec040a427f51f212a562f34daa68363601ac083))
* vertically center actions in connection card ([956c7b0](https://github.com/abdullahmia/compooss/commit/956c7b0278feaabafdca86403ac42c4403bf4de0))


### Refactors

* replace raw buttons with UI Button/IconButton across app ([aa3f850](https://github.com/abdullahmia/compooss/commit/aa3f850d82f4f8f8e5d82f8fbf12f81a716fd0b8))
* replace raw inputs and checkboxes with UI Input/Checkbox across app ([e71cbc1](https://github.com/abdullahmia/compooss/commit/e71cbc1e5c186473caa142aa50cd9750bf8d8eea))

## [1.8.1](https://github.com/abdullahmia/compooss/compare/v1.8.0...v1.8.1) (2026-04-11)


### Bug Fixes

* resolve type mismatch in optional-payload mutation hooks ([3268802](https://github.com/abdullahmia/compooss/commit/3268802b66f8ec02c50801053b2f51ee3f7bcb51))
* resolve type mismatch in optional-payload mutation hooks ([c59844e](https://github.com/abdullahmia/compooss/commit/c59844e4b8031a355c51c60b633e2fffefefe7b4))

## [1.8.0](https://github.com/abdullahmia/compooss/compare/v1.7.0...v1.8.0) (2026-04-11)


### Features

* add collection deletion functionality ([98138a7](https://github.com/abdullahmia/compooss/commit/98138a7afefd7c7e21298c1072ba00f2bb44f5a4))
* add collection stats retrieval and formatting for display in database service ([3324e2d](https://github.com/abdullahmia/compooss/commit/3324e2dfcb9fdee338b006b34de9e5c192033db3))
* add comparison table and "Why Compooss" section ([daa737c](https://github.com/abdullahmia/compooss/commit/daa737cd443353eb422c227cef46c1218dc2fcc8))
* add docs for compooss ([d98362c](https://github.com/abdullahmia/compooss/commit/d98362ce0e97437aba11e62b9489471e1587f36f))
* add docs for compooss ([66065a5](https://github.com/abdullahmia/compooss/commit/66065a5e31f4ce7b75ac93d0114844783ebfbdfd))
* add document deletion functionality and enhance JSON document component ([c7e1828](https://github.com/abdullahmia/compooss/commit/c7e1828a2e51ce73cf52643114709e3d7f343cba))
* add JsonDocumentSkeleton component and improve loading state handling in DocumentsTab ([68df769](https://github.com/abdullahmia/compooss/commit/68df769e96afdd43099590f9a6ca0e5d22e69979))
* add new database ([dee46f9](https://github.com/abdullahmia/compooss/commit/dee46f99a7d1b230235ff956203e69e3555d4204))
* add Storybook and Button component stories ([252f3a3](https://github.com/abdullahmia/compooss/commit/252f3a3b454a93ee1453710ff7057bfbc6daf866))
* added 404 for the docs ([47b5819](https://github.com/abdullahmia/compooss/commit/47b5819ad7739a1b0c19328c54189e431b705860))
* added api ([d351f35](https://github.com/abdullahmia/compooss/commit/d351f35c9d4969b7711be37a6028776d74e5207c))
* added db connection ([8cbe11d](https://github.com/abdullahmia/compooss/commit/8cbe11d7412195c58fac57d52d9801fb274cd08a))
* added edit document ([c2798dc](https://github.com/abdullahmia/compooss/commit/c2798dcec10b4874fe3131e0ff2cc092b0f3ecac))
* added issues for windows users on docs ([c06d6d3](https://github.com/abdullahmia/compooss/commit/c06d6d3af49b285f86a7a018af85c0af2adcd423))
* enhance connection form with error handling ([a34fc41](https://github.com/abdullahmia/compooss/commit/a34fc4130a4ff102d366f87dcff0c49dd4d80fee))
* enhance database page with loading skeletons and improve error handling in API routes ([466ff89](https://github.com/abdullahmia/compooss/commit/466ff89fc1a0d4961d67cc3a4d75494bdfb9fa9e))
* enhance document handling and add document insertion functionality ([6c069d2](https://github.com/abdullahmia/compooss/commit/6c069d242a44589b69b3d7519396db6bc132914c))
* enhance document update functionality and refactor document handling components ([0c93429](https://github.com/abdullahmia/compooss/commit/0c9342952ae867d9ace84043e87e266066ca611a))
* enhance playground layout with connection string display and loading state ([1127421](https://github.com/abdullahmia/compooss/commit/11274210ecde6bf90cd64a0d91cd7f08692c51d4))
* implement access control for protected databases ([3d1df5f](https://github.com/abdullahmia/compooss/commit/3d1df5fb34c043ec306e40efc30ebdcb9fd7b831))
* implement advanced document querying with filter, sort, and pagination support ([5435197](https://github.com/abdullahmia/compooss/commit/54351976fe4c84693e74b99b31d62611945177e4))
* implement collection creation functionality ([0957bc0](https://github.com/abdullahmia/compooss/commit/0957bc09c07c41808a08127ff2bd38c87f92baef))
* implement database deletion functionality ([9b7cd10](https://github.com/abdullahmia/compooss/commit/9b7cd1043fc9168d3be5016dde616f0c643f9652))
* implement full index management for collections in v1.2.0 ([4a790ac](https://github.com/abdullahmia/compooss/commit/4a790ac2534f8871d9ec074867f20e7b6dc989c9))
* implement full index management for collections in v1.2.0 ([303f489](https://github.com/abdullahmia/compooss/commit/303f48924da9c4e63b438526dd69820394eb26d8))
* implement loading skeletons for database and collection views t… ([7c178d6](https://github.com/abdullahmia/compooss/commit/7c178d68ff542e1561e027e10bbd73ec9f89b892))
* implement loading skeletons for database and collection views to improve user experience ([6cc9838](https://github.com/abdullahmia/compooss/commit/6cc983859f26bb790cf53d93e64cd8e9ea418304))
* improve error handling and user feedback for database connections in UI components ([4d4ad1e](https://github.com/abdullahmia/compooss/commit/4d4ad1ef9f426360617c5e217380f21c882fc8fb))
* init bmad-method ([64afb03](https://github.com/abdullahmia/compooss/commit/64afb03899c2ba0b78bed2f9b43fcea86e9b288c))
* initial scaffold ([33eb842](https://github.com/abdullahmia/compooss/commit/33eb842b6e12c9872cd9b23674e4e51a9d643100))
* integrate api on database collections ([db9c46c](https://github.com/abdullahmia/compooss/commit/db9c46ceea10fd96d3583d812b348363aac97e47))
* integrate headers for connection health check in playground ([a906c8d](https://github.com/abdullahmia/compooss/commit/a906c8d50df443ecd992ca97b4a47d59dadc34ce))
* introduce schema analysis feature in v1.3.0, enhancing collecti… ([bfdf7d7](https://github.com/abdullahmia/compooss/commit/bfdf7d7abc3bde1567c9615683553b1df7dc9331))
* introduce schema analysis feature in v1.3.0, enhancing collection management ([07c6d29](https://github.com/abdullahmia/compooss/commit/07c6d29e6d0078a6927b92ea26d0fe70e8ffa630))
* introduce validation rules feature, allowing users to create, edit, and manage JSON Schema ([ffc966d](https://github.com/abdullahmia/compooss/commit/ffc966d9cd7ea1365fd96148c43bbf33d2948a0a))
* redesign the connection page ([410252b](https://github.com/abdullahmia/compooss/commit/410252b881804bf1ffc527f159a80f60c1450be4))
* redesign the docs header ([08023b8](https://github.com/abdullahmia/compooss/commit/08023b82d86c392ccf458f839b6a924f2a52a793))
* redesign the up coming & footer ([22ce189](https://github.com/abdullahmia/compooss/commit/22ce189e291b2bd77d260287d403c8b064236240))
* redesign the welcome screen ([6f8382a](https://github.com/abdullahmia/compooss/commit/6f8382a89f5dc26e2ff4df6b8e9c40d9c9602595))
* release aggregation pipelines feature ([dd89362](https://github.com/abdullahmia/compooss/commit/dd89362d22307a3d4fcebc3bda3650a7d4b2e84b))
* release multiple connections feature ([118dfee](https://github.com/abdullahmia/compooss/commit/118dfeeac6aadf85b130c0f73a067464666c37d3))
* release multiple connections feature ([83a9d99](https://github.com/abdullahmia/compooss/commit/83a9d99554a91ec47e953ffd800d4d0ac0827039))
* release v1.6.0 with embedded MongoDB shell feature, enhancing command execution capabilities ([29cd547](https://github.com/abdullahmia/compooss/commit/29cd5472d9cb193746a3eb2afb6a5c35d39e96d4))
* update Dockerfile for pnpm support ([1b21d9b](https://github.com/abdullahmia/compooss/commit/1b21d9b8cb06dec9426c13021d6db6f8bba546e2))
* update modal UI ([3151775](https://github.com/abdullahmia/compooss/commit/31517756d19cbdb99a4b84f82c87b1535ce940be))


### Bug Fixes

* add missing mutation argument to onSuccess callbacks in service hooks ([931875d](https://github.com/abdullahmia/compooss/commit/931875da333cd96517a5d6635b02e56e2cea4085))
* add multi-platform support for linux/amd64 and linux/arm64 ([e6e7d3b](https://github.com/abdullahmia/compooss/commit/e6e7d3b7617a2727bcf44836ed01bf44356abeee))
* added package manager in package.json ([efaec29](https://github.com/abdullahmia/compooss/commit/efaec29bc022e26c391c8a4df78bc9a69b637574))
* correct bun lockfile name in Dockerfile from bun.lockb to bun.lock ([9031715](https://github.com/abdullahmia/compooss/commit/90317155bc6da9a91e1d6e0c41de8de93838bb9c))
* correct bun lockfile name in Dockerfile from bun.lockb to bun.lock ([00bdeb1](https://github.com/abdullahmia/compooss/commit/00bdeb1ccd79b98da2038e9718c22c0c7bb97a53))
* deployment issues ([387debd](https://github.com/abdullahmia/compooss/commit/387debdd6c04765aea7c5f69935d7fb22749d7a7))
* prevent document mutations from skipping cache invalidation ([ad3a6da](https://github.com/abdullahmia/compooss/commit/ad3a6da20037f1fb56750c6ae81b2920753ed9d9))
* resolved documents counts for collections ([0811afc](https://github.com/abdullahmia/compooss/commit/0811afc10cb6cfb2c1c8b928b327fa392862edb1))
* resolved the release please warnings ([15d6a7f](https://github.com/abdullahmia/compooss/commit/15d6a7f29de664e475c5a47dff954e78caa04feb))
* suppress hydration warnings in layout component ([fda2d81](https://github.com/abdullahmia/compooss/commit/fda2d8190294f7f2c5616ec16d590ab03a0ccb77))


### Refactors

* added favicon on the docs ([4cea890](https://github.com/abdullahmia/compooss/commit/4cea89011a357dc06a51e8dc78b67efd297bcc4f))
* added reuseable component ([6b2c12f](https://github.com/abdullahmia/compooss/commit/6b2c12fef1490ba6a63d1e286f737ff87956f904))
* code structure for improved readability and maintainability ([438e3dc](https://github.com/abdullahmia/compooss/commit/438e3dc815b1cf40e3fedf7df17f54d4a8f7a9a0))
* extract shared api-route helpers and standardise response format ([8e41164](https://github.com/abdullahmia/compooss/commit/8e41164fcc436fbb2d020ff4b37ad87d075e5e91))
* migrate components to lib/ and remove unused legacy code ([490668f](https://github.com/abdullahmia/compooss/commit/490668f1ba37f39f882c6381a55d9bce5e0d3012))
* refactor playground layout and shell components & add it with pages ([06111f2](https://github.com/abdullahmia/compooss/commit/06111f28dbd887be9c2a14333d591df86ccc765b))
* refactor the collection module ([5aec62b](https://github.com/abdullahmia/compooss/commit/5aec62bf5a4dbf4e297db4bf9380c2073f90d6d9))
* refactor the connection management ([f6769a1](https://github.com/abdullahmia/compooss/commit/f6769a1ce2cf8549ec2776050ac3c745522caf85))
* refactor the databased module ([5eb0f02](https://github.com/abdullahmia/compooss/commit/5eb0f028f54458a00c62f50dcadfa96e38d8bc2f))
* refactor the workspaces ([3524d1e](https://github.com/abdullahmia/compooss/commit/3524d1ea9a686cadf8b904d3f089498d1c265f27))
* remove playground components and related pages for cleanup ([3ea3db1](https://github.com/abdullahmia/compooss/commit/3ea3db1d638818670e76969ca63d42216d9ec3b0))
* rename lib/db to lib/storage and clean up MongoDriver ([5210468](https://github.com/abdullahmia/compooss/commit/5210468aa1231f6dc776d1e022073eb056529e8c))
* reorganize services by removing old implementations ([0677ad2](https://github.com/abdullahmia/compooss/commit/0677ad22cb8628c637a02491890895a3eec8503e))
* replace button elements with a unified Button component ([aef7668](https://github.com/abdullahmia/compooss/commit/aef7668ede1f10df1d4e04d588deacc22dca6a95))
* simplify NewConnection component and remove unused connection services ([9ff928c](https://github.com/abdullahmia/compooss/commit/9ff928c87a53a5406a9e56289ea8a90451a8bf97))
* simplify TopBar component and comment out unused features in WelcomeView ([88685db](https://github.com/abdullahmia/compooss/commit/88685db6bfac0c731b0bd1962e62b1c0ebdac45a))
* update readme and documentation to enhance feature description ([f2e77e8](https://github.com/abdullahmia/compooss/commit/f2e77e8781266c9c33b7d61ac72a269d8088fc6f))
* use relative /api base URL and drop .env.example ([eaec17c](https://github.com/abdullahmia/compooss/commit/eaec17c5a2cb81034749763941f3f3d46ea23fc0))


### Documentation

* add initial README and MIT license ([072c315](https://github.com/abdullahmia/compooss/commit/072c315b4184a8e7f3eb32c7e7039174f287e471))
* add project docs and move preview to docs directory ([e5edf7d](https://github.com/abdullahmia/compooss/commit/e5edf7d6947dfe85475876e000df7f930601c824))
* improve contributing guide, dev docs, and readme navigation ([08be280](https://github.com/abdullahmia/compooss/commit/08be280d2b3a94facfb2ed5c75a4b88eb76d95f2))
* improve contributing guide, dev docs, and readme navigation ([84ebc48](https://github.com/abdullahmia/compooss/commit/84ebc480367ba5209e46ce49c167e05d3bfdc6c6))
* overhaul README and contributor docs for open source release ([715a854](https://github.com/abdullahmia/compooss/commit/715a854d1c19ff7dce6c43a96a0c21b245920736))
* update author URL in README license section ([8fb5d4b](https://github.com/abdullahmia/compooss/commit/8fb5d4bf26ac5f6105be77a762cb072a86c5b84d))
* update the pull request template ([be239d2](https://github.com/abdullahmia/compooss/commit/be239d258b103fb1cbc8858bc9bf927bc7e7e928))
