import { BaseForm } from "components/ResumeForm/Form";
import { Input, Textarea } from "components/ResumeForm/Form/InputGroup";
import { useAppDispatch, useAppSelector } from "lib/redux/hooks";
import { changeProfile, selectProfile } from "lib/redux/resumeSlice";
import { ResumeProfile } from "lib/redux/types";
import { useEffect } from "react";

export const ProfileForm = () => {
  const profile = useAppSelector(selectProfile);
  const dispatch = useAppDispatch();
  
  // Debug logging
  console.log('🔍 ProfileForm - profile from Redux:', profile);
  console.log('🔍 ProfileForm - profile type:', typeof profile);
  console.log('🔍 ProfileForm - profile is undefined:', profile === undefined);
  
  // Add fallback protection for undefined profile
  const { name, email, phone, url, summary, location } = profile || {
    name: "",
    email: "",
    phone: "",
    url: "",
    summary: "",
    location: ""
  };

  const handleProfileChange = (field: keyof ResumeProfile, value: string) => {
    console.log(`📝 ProfileForm - Updating ${field}:`, value);
    dispatch(changeProfile({ field, value }));
  };

  // Monitor profile changes
  useEffect(() => {
    console.log('🔍 ProfileForm - Profile changed:', profile);
  }, [profile]);

  return (
    <BaseForm>
      <div className="grid grid-cols-6 gap-3">
        <Input
          label="Name"
          labelClassName="col-span-full"
          name="name"
          placeholder="Sal Khan"
          value={name}
          onChange={handleProfileChange}
        />
        <Textarea
          label="Objective"
          labelClassName="col-span-full"
          name="summary"
          placeholder="Entrepreneur and educator obsessed with making education free for anyone"
          value={summary}
          onChange={handleProfileChange}
        />
        <Input
          label="Email"
          labelClassName="col-span-4"
          name="email"
          placeholder="hello@khanacademy.org"
          value={email}
          onChange={handleProfileChange}
        />
        <Input
          label="Phone"
          labelClassName="col-span-2"
          name="phone"
          placeholder="(123)456-7890"
          value={phone}
          onChange={handleProfileChange}
        />
        <Input
          label="Website"
          labelClassName="col-span-4"
          name="url"
          placeholder="linkedin.com/in/khanacademy"
          value={url}
          onChange={handleProfileChange}
        />
        <Input
          label="Location"
          labelClassName="col-span-2"
          name="location"
          placeholder="NYC, NY"
          value={location}
          onChange={handleProfileChange}
        />
      </div>
    </BaseForm>
  );
};
