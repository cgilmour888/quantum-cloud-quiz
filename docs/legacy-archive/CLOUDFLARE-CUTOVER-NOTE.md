# Cloudflare Cutover Note

The legacy Cloudflare project should remain unchanged during the native rebuild unless there is a separate reason to take it offline.

Recommended transition:

1. keep the legacy repository and current deployment available as historical reference;
2. create a separate Cloudflare Pages preview project for `quantum-cloud-quiz-native`;
3. validate the preview against the native-build acceptance gates;
4. move the production domain only after explicit approval;
5. retain documented rollback instructions during the cutover.
