import {
  Button,
  Form,
  FormLabel,
  InlineLoading,
  TextInput,
  ToastNotification,
} from "carbon-components-react";
import { Formik } from "formik";
import React, { useCallback, useState } from "react";
import { isWebUri } from "valid-url";
import googleIcon from "@iconify-icons/logos/google-icon";
import { Icon } from "@iconify/react";
import FormGroup from "./FormGroup";
import axios from "axios";
import { H4 } from "./Heading";
import { clearStoredToken, requestOAuth } from "../utils/oauth";
import {
  castManifestData,
  ManifestData,
  storeManifestInfo,
} from "../utils/manifest";
import { useManifest } from "../utils/hooks/manifest";
import { useLatestProfile } from "../utils/hooks/oauth";
import { log } from "../utils/log";

export default function AuthenticateOptions() {
  const [signInState, setSignInState] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<React.ReactNode>(null);
  const manifest = useManifest();
  const [profile, isLoadingProfile] = useLatestProfile();

  const handleSignOut = useCallback(async () => {
    await clearStoredToken();
  }, []);

  return (
    <div>
      <H4>Authenticate</H4>
      {isLoadingProfile && (
        <FormGroup>
          <InlineLoading
            status="active"
            description="Loading sign in status..."
          />
        </FormGroup>
      )}
      {Boolean(!isLoadingProfile && profile?.email) && (
        <>
          <FormGroup>
            <InlineLoading
              status="finished"
              description={
                <span>
                  You are signed in with <strong>{profile!.email}</strong>
                  <br />
                  Workspace: <strong>{manifest?.data.gapiHostedDomain}</strong>
                </span>
              }
            />
          </FormGroup>
          <FormGroup>
            <Button type="submit" kind="secondary" onClick={handleSignOut}>
              Sign out
            </Button>
          </FormGroup>
        </>
      )}
      {Boolean(!isLoadingProfile && !profile?.email) && (
        <>
          <FormLabel>
            Google sign in is required in order to enable this browser
            extension. To begin, specify the GdocWiki workspace, and then use
            your Google account to sign into this workspace.
          </FormLabel>
          <Formik
            enableReinitialize={true}
            initialValues={{ url: manifest?.uri || "" }}
            validate={({ url }) => {
              let errors: any = {};
              if (!url) {
                errors["url"] = "Required";
              } else if (!isWebUri(url)) {
                errors["url"] = "Workspace URL is invalid";
              }
              return errors;
            }}
            onSubmit={async (values) => {
              setSignInState("Discovering the workspace...");
              setErrMsg(null);
              const targetUri = `${values.url}/ext_manifest.json`;
              try {
                const response = await axios.get(
                  `${targetUri}?_t=${Date.now()}`
                );
                if (!response) {
                  throw new Error("Unknown manifest");
                }
                const { data } = response;
                let manifest: ManifestData;
                try {
                  manifest = castManifestData(data);
                } catch (e) {
                  throw new Error(`Unrecognized manifest format. ${e.message}`);
                }
                await storeManifestInfo(values.url, manifest);
                setSignInState(
                  `${manifest.gapiHostedDomain} workspace detected, signing in...`
                );
                try {
                  const token = await requestOAuth();
                  log.info("OAuth token retrieved");
                  log.info(token);
                } catch (e) {
                  log.error("Sign in failed");
                  log.info(e);
                  setErrMsg(<div>Sign in failed: {e.message}</div>);
                }
              } catch (e) {
                log.error("Detect workspace failed");
                log.error(e);
                setErrMsg(
                  <div>
                    Detect workspace failed. Did you specified the correct URL?
                    <h3 className="bx--toast-notification__title">
                      Error Details
                    </h3>
                    Request "{targetUri}" failed:
                    <br />
                    {e.message}
                  </div>
                );
              } finally {
                setSignInState(null);
              }
            }}
          >
            {(props) => (
              <Form
                onSubmit={props.handleSubmit}
                onChange={props.handleChange}
                onBlur={props.handleBlur}
              >
                <FormGroup>
                  <TextInput
                    id="url"
                    name="url"
                    labelText="GdocWiki Workspace URL:"
                    size="sm"
                    placeholder="https://wiki.foo.com"
                    value={props.values.url}
                    invalidText={props.errors.url}
                    invalid={Boolean(props.touched.url && props.errors.url)}
                    autoFocus
                  />
                </FormGroup>
                {errMsg && (
                  <ToastNotification
                    kind="error"
                    title="Error"
                    subtitle={errMsg}
                    hideCloseButton
                    style={{ width: "auto" }}
                  />
                )}
                <FormGroup>
                  {props.isSubmitting ? (
                    <InlineLoading status="active" description={signInState} />
                  ) : (
                    <Button
                      type="submit"
                      kind="secondary"
                      disabled={props.isSubmitting}
                    >
                      <Icon icon={googleIcon} style={{ marginRight: 8 }} />
                      Sign into this Workspace
                    </Button>
                  )}
                </FormGroup>
              </Form>
            )}
          </Formik>
        </>
      )}
    </div>
  );
}
