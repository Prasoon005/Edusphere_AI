export interface ClassOption {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
}

export interface SectionOption {
  id: string;
  name: string;
  classId: string;
  class: { id: string; name: string };
}

export interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

export interface SemesterOption {
  id: string;
  name: string;
  isCurrent: boolean;
  academicYear: { name: string };
}
