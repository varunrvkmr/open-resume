"use client";
import { Provider } from "react-redux";
import { store } from "lib/redux/store";
import { ResumeForm } from "components/ResumeForm";
import { Resume } from "components/Resume";
import { MasterResumeWrapper } from "components/MasterResumeWrapper";
import { TailoredResumeWrapper } from "components/TailoredResumeWrapper";

export default function Create() {
  return (
    <Provider store={store}>
      <TailoredResumeWrapper>
        <MasterResumeWrapper>
          <main className="relative h-full w-full overflow-hidden bg-gray-50">
            <div className="grid grid-cols-3 md:grid-cols-6">
              <div className="col-span-3">
                <ResumeForm />
              </div>
              <div className="col-span-3">
                <Resume />
              </div>
            </div>
          </main>
        </MasterResumeWrapper>
      </TailoredResumeWrapper>
    </Provider>
  );
}
