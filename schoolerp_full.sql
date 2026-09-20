--
-- PostgreSQL database dump
--

\restrict W3ppszVc7mZ2XZqIqVaLfsuxY2zg99vOHN3uL643nMeLS7NG5YiVfSFX2h83LtX

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP INDEX IF EXISTS public.uq_timetables_class_version;
DROP INDEX IF EXISTS public.uq_timetable_slots_tt_day_period;
DROP INDEX IF EXISTS public.uq_subjects_inst_name;
DROP INDEX IF EXISTS public.uq_subject_teachers_class_subject;
DROP INDEX IF EXISTS public.uq_student_classes_class_student_year;
DROP INDEX IF EXISTS public.uq_marks_exam_subject_student;
DROP INDEX IF EXISTS public.uq_exam_subjects_exam_subject;
DROP INDEX IF EXISTS public.uq_class_sections_inst_name;
DROP INDEX IF EXISTS public.uq_attendance_records_slot_date;
DROP INDEX IF EXISTS public.uq_attendance_entries_record_student;
DROP INDEX IF EXISTS public.idx_users_institution_code;
DROP INDEX IF EXISTS public.idx_timetables_inst;
DROP INDEX IF EXISTS public.idx_timetables_class;
DROP INDEX IF EXISTS public.idx_timetable_slots_tt;
DROP INDEX IF EXISTS public.idx_timetable_slots_teacher;
DROP INDEX IF EXISTS public.idx_timetable_slots_class;
DROP INDEX IF EXISTS public.idx_subjects_inst;
DROP INDEX IF EXISTS public.idx_subject_teachers_teacher;
DROP INDEX IF EXISTS public.idx_subject_teachers_inst;
DROP INDEX IF EXISTS public.idx_subject_teachers_class;
DROP INDEX IF EXISTS public.idx_student_documents_student;
DROP INDEX IF EXISTS public.idx_student_documents_inst;
DROP INDEX IF EXISTS public.idx_student_classes_student;
DROP INDEX IF EXISTS public.idx_student_classes_inst;
DROP INDEX IF EXISTS public.idx_student_classes_class;
DROP INDEX IF EXISTS public.idx_student_classes_active_student;
DROP INDEX IF EXISTS public.idx_periods_inst;
DROP INDEX IF EXISTS public.idx_marks_student;
DROP INDEX IF EXISTS public.idx_marks_exam;
DROP INDEX IF EXISTS public.idx_marks_class;
DROP INDEX IF EXISTS public.idx_homework_teacher;
DROP INDEX IF EXISTS public.idx_homework_subject;
DROP INDEX IF EXISTS public.idx_homework_inst;
DROP INDEX IF EXISTS public.idx_homework_due_date;
DROP INDEX IF EXISTS public.idx_homework_class;
DROP INDEX IF EXISTS public.idx_fee_structures_inst;
DROP INDEX IF EXISTS public.idx_fee_structures_class;
DROP INDEX IF EXISTS public.idx_fee_structures_category;
DROP INDEX IF EXISTS public.idx_fee_payments_student;
DROP INDEX IF EXISTS public.idx_fee_payments_status;
DROP INDEX IF EXISTS public.idx_fee_payments_inst;
DROP INDEX IF EXISTS public.idx_fee_payments_fee_structure;
DROP INDEX IF EXISTS public.idx_exams_status;
DROP INDEX IF EXISTS public.idx_exams_inst;
DROP INDEX IF EXISTS public.idx_exam_subjects_exam;
DROP INDEX IF EXISTS public.idx_class_sections_teacher;
DROP INDEX IF EXISTS public.idx_class_sections_inst;
DROP INDEX IF EXISTS public.idx_attendance_records_teacher;
DROP INDEX IF EXISTS public.idx_attendance_records_slot;
DROP INDEX IF EXISTS public.idx_attendance_records_inst;
DROP INDEX IF EXISTS public.idx_attendance_records_date;
DROP INDEX IF EXISTS public.idx_attendance_entries_student;
DROP INDEX IF EXISTS public.idx_attendance_entries_record;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_firebase_uid_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.timetables DROP CONSTRAINT IF EXISTS timetables_pkey;
ALTER TABLE IF EXISTS ONLY public.timetable_slots DROP CONSTRAINT IF EXISTS timetable_slots_pkey;
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS subjects_pkey;
ALTER TABLE IF EXISTS ONLY public.subject_teachers DROP CONSTRAINT IF EXISTS subject_teachers_pkey;
ALTER TABLE IF EXISTS ONLY public.student_documents DROP CONSTRAINT IF EXISTS student_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.student_classes DROP CONSTRAINT IF EXISTS student_classes_pkey;
ALTER TABLE IF EXISTS ONLY public.periods DROP CONSTRAINT IF EXISTS periods_pkey;
ALTER TABLE IF EXISTS ONLY public.marks DROP CONSTRAINT IF EXISTS marks_pkey;
ALTER TABLE IF EXISTS ONLY public.institutions DROP CONSTRAINT IF EXISTS institutions_pkey;
ALTER TABLE IF EXISTS ONLY public.institutions DROP CONSTRAINT IF EXISTS institutions_institution_code_unique;
ALTER TABLE IF EXISTS ONLY public.homework DROP CONSTRAINT IF EXISTS homework_pkey;
ALTER TABLE IF EXISTS ONLY public.fee_structures DROP CONSTRAINT IF EXISTS fee_structures_pkey;
ALTER TABLE IF EXISTS ONLY public.fee_payments DROP CONSTRAINT IF EXISTS fee_payments_pkey;
ALTER TABLE IF EXISTS ONLY public.exams DROP CONSTRAINT IF EXISTS exams_pkey;
ALTER TABLE IF EXISTS ONLY public.exam_subjects DROP CONSTRAINT IF EXISTS exam_subjects_pkey;
ALTER TABLE IF EXISTS ONLY public.class_sections DROP CONSTRAINT IF EXISTS class_sections_pkey;
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_pkey;
ALTER TABLE IF EXISTS ONLY public.attendance_entries DROP CONSTRAINT IF EXISTS attendance_entries_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.timetables;
DROP TABLE IF EXISTS public.timetable_slots;
DROP TABLE IF EXISTS public.subjects;
DROP TABLE IF EXISTS public.subject_teachers;
DROP TABLE IF EXISTS public.student_documents;
DROP TABLE IF EXISTS public.student_classes;
DROP TABLE IF EXISTS public.periods;
DROP TABLE IF EXISTS public.marks;
DROP TABLE IF EXISTS public.institutions;
DROP TABLE IF EXISTS public.homework;
DROP TABLE IF EXISTS public.fee_structures;
DROP TABLE IF EXISTS public.fee_payments;
DROP TABLE IF EXISTS public.exams;
DROP TABLE IF EXISTS public.exam_subjects;
DROP TABLE IF EXISTS public.class_sections;
DROP TABLE IF EXISTS public.attendance_records;
DROP TABLE IF EXISTS public.attendance_entries;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attendance_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_entries (
    id text NOT NULL,
    attendance_record_id text NOT NULL,
    student_id text NOT NULL,
    attendance_status character varying(20) DEFAULT 'present'::character varying NOT NULL,
    remarks text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_records (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    timetable_slot_id text NOT NULL,
    date date NOT NULL,
    taken_by_teacher_id text NOT NULL,
    status character varying(20) DEFAULT 'submitted'::character varying NOT NULL,
    submitted_at timestamp without time zone DEFAULT now(),
    locked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: class_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_sections (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    department character varying(200) DEFAULT ''::character varying,
    academic_year character varying(100) DEFAULT ''::character varying,
    section character varying(50) DEFAULT ''::character varying,
    class_teacher_id text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: exam_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_subjects (
    id text NOT NULL,
    exam_id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    subject_id text NOT NULL,
    max_marks integer DEFAULT 100 NOT NULL,
    pass_marks integer DEFAULT 35 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: exams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exams (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    term character varying(100) DEFAULT ''::character varying,
    academic_year character varying(50) DEFAULT ''::character varying,
    start_date date,
    end_date date,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    created_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: fee_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_payments (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    fee_structure_id text NOT NULL,
    student_id text NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(30) DEFAULT 'upi'::character varying NOT NULL,
    payment_date date,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    receipt_no character varying(50),
    notes text,
    created_by text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: fee_structures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fee_structures (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    class_section_id text,
    title character varying(255) NOT NULL,
    category character varying(50) DEFAULT 'student_fee'::character varying NOT NULL,
    amount numeric(12,2) NOT NULL,
    term character varying(100),
    academic_year character varying(20),
    due_date date,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_by text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: homework; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.homework (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    class_section_id text NOT NULL,
    subject_id text NOT NULL,
    teacher_id text NOT NULL,
    title character varying(300) NOT NULL,
    description text DEFAULT ''::text,
    due_date date NOT NULL,
    assigned_date date DEFAULT '2024-01-01'::date NOT NULL,
    priority character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb,
    created_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: institutions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institutions (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    institution_name text NOT NULL,
    institution_type character varying(50) DEFAULT 'college'::character varying NOT NULL,
    subscription_status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    departments jsonb DEFAULT '[]'::jsonb,
    academic_years jsonb DEFAULT '[]'::jsonb,
    courses jsonb DEFAULT '[]'::jsonb,
    terms jsonb DEFAULT '[]'::jsonb,
    blocked_dates jsonb DEFAULT '[]'::jsonb
);


--
-- Name: marks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marks (
    id text NOT NULL,
    exam_id text NOT NULL,
    exam_subject_id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    student_id text NOT NULL,
    class_section_id text NOT NULL,
    subject_id text NOT NULL,
    marks_obtained numeric(6,2) DEFAULT 0 NOT NULL,
    grade character varying(5) DEFAULT ''::character varying,
    remarks text DEFAULT ''::text,
    entered_by text NOT NULL,
    entered_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.periods (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    label character varying(100) NOT NULL,
    start_time character varying(5) NOT NULL,
    end_time character varying(5) NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: student_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_classes (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    student_id text NOT NULL,
    class_section_id text NOT NULL,
    roll_no character varying(50) DEFAULT ''::character varying,
    academic_year character varying(50) DEFAULT ''::character varying,
    effective_from date DEFAULT '2024-01-01'::date NOT NULL,
    effective_to date,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: student_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_documents (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    student_id text NOT NULL,
    document_type character varying(100) NOT NULL,
    file_name text DEFAULT ''::text,
    file_url text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: subject_teachers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subject_teachers (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    class_section_id text NOT NULL,
    subject_id text NOT NULL,
    teacher_id text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(50) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: timetable_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.timetable_slots (
    id text NOT NULL,
    timetable_id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    class_section_id text NOT NULL,
    subject_id text NOT NULL,
    teacher_id text NOT NULL,
    period_id text NOT NULL,
    day_of_week integer NOT NULL,
    room character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: timetables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.timetables (
    id text NOT NULL,
    institution_code character varying(100) NOT NULL,
    class_section_id text NOT NULL,
    academic_year character varying(100) DEFAULT ''::character varying,
    term character varying(100) DEFAULT ''::character varying,
    version integer DEFAULT 1 NOT NULL,
    effective_from date NOT NULL,
    created_by text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    firebase_uid text NOT NULL,
    email character varying(255) NOT NULL,
    full_name text NOT NULL,
    role character varying(50) DEFAULT 'student'::character varying NOT NULL,
    institution_code character varying(100) DEFAULT ''::character varying,
    institution_name text DEFAULT ''::text,
    institution_type character varying(50) DEFAULT 'school'::character varying,
    roll_no_usn character varying(100) DEFAULT ''::character varying,
    must_change_password boolean DEFAULT false,
    profile_completed boolean DEFAULT false,
    parent_phone character varying(20) DEFAULT ''::character varying,
    student_phone character varying(20) DEFAULT ''::character varying,
    profile_pic_url text DEFAULT ''::text,
    tenth_percentage character varying(10) DEFAULT ''::character varying,
    twelfth_percentage character varying(10) DEFAULT ''::character varying,
    title text DEFAULT ''::text,
    scope jsonb DEFAULT '{}'::jsonb,
    permissions jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    graduated_at timestamp without time zone
);


--
-- Data for Name: attendance_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_entries (id, attendance_record_id, student_id, attendance_status, remarks, created_at, updated_at) FROM stdin;
ae_1788405363269_l3cgrw	ar_1788405363246_1oots3	usr_1788361696558_4x5g	present		2026-09-03 08:46:03.270694	2026-09-03 08:46:03.270694
ae_1788405363296_1my22v	ar_1788405363246_1oots3	usr_1788405363182_d7rnj8	present		2026-09-03 08:46:03.297643	2026-09-03 08:46:03.297643
ae_1788405363297_413asb	ar_1788405363246_1oots3	usr_1788405363217_tj8o9z	present		2026-09-03 08:46:03.298768	2026-09-03 08:46:03.298768
ae_1788405363298_bq15y7	ar_1788405363246_1oots3	usr_1788405363220_sok6dj	present		2026-09-03 08:46:03.299801	2026-09-03 08:46:03.299801
ae_1788405363299_qbae2i	ar_1788405363246_1oots3	usr_1788405363222_lhyvtz	present		2026-09-03 08:46:03.300797	2026-09-03 08:46:03.300797
ae_1788405363301_kxx0pw	ar_1788405363246_1oots3	usr_1788405363224_3e7k3h	present		2026-09-03 08:46:03.302728	2026-09-03 08:46:03.302728
ae_1788405363302_z353c5	ar_1788405363246_1oots3	usr_1788405363227_24ccwl	late	Came in 10 min late	2026-09-03 08:46:03.303716	2026-09-03 08:46:03.303716
ae_1788405363303_zhediv	ar_1788405363246_1oots3	usr_1788405363229_c4a1z0	late	Came in 10 min late	2026-09-03 08:46:03.30482	2026-09-03 08:46:03.30482
ae_1788405363304_pgq2xu	ar_1788405363246_1oots3	usr_1788405363231_ubswfh	absent	Absent without notice	2026-09-03 08:46:03.30593	2026-09-03 08:46:03.30593
ae_1788405363305_7grcjt	ar_1788405363246_1oots3	usr_1788405363233_jmtosk	present		2026-09-03 08:46:03.306958	2026-09-03 08:46:03.306958
ae_1788405363308_1bju7z	ar_1788405363307_ojm1my	usr_1788361696558_4x5g	present		2026-09-03 08:46:03.309841	2026-09-03 08:46:03.309841
ae_1788405363309_h3mu2a	ar_1788405363307_ojm1my	usr_1788405363182_d7rnj8	present		2026-09-03 08:46:03.31079	2026-09-03 08:46:03.31079
ae_1788405363310_xa6scj	ar_1788405363307_ojm1my	usr_1788405363217_tj8o9z	present		2026-09-03 08:46:03.311847	2026-09-03 08:46:03.311847
ae_1788405363311_fnm18r	ar_1788405363307_ojm1my	usr_1788405363220_sok6dj	late	Came in 10 min late	2026-09-03 08:46:03.312846	2026-09-03 08:46:03.312846
ae_1788405363312_nih4qv	ar_1788405363307_ojm1my	usr_1788405363222_lhyvtz	late	Came in 10 min late	2026-09-03 08:46:03.313767	2026-09-03 08:46:03.313767
ae_1788405363313_xyagwg	ar_1788405363307_ojm1my	usr_1788405363224_3e7k3h	absent	Absent without notice	2026-09-03 08:46:03.314886	2026-09-03 08:46:03.314886
ae_1788405363314_rq2m85	ar_1788405363307_ojm1my	usr_1788405363227_24ccwl	present		2026-09-03 08:46:03.315844	2026-09-03 08:46:03.315844
ae_1788405363315_p2i0bc	ar_1788405363307_ojm1my	usr_1788405363229_c4a1z0	present		2026-09-03 08:46:03.316881	2026-09-03 08:46:03.316881
ae_1788405363316_t3qk1w	ar_1788405363307_ojm1my	usr_1788405363231_ubswfh	present		2026-09-03 08:46:03.317837	2026-09-03 08:46:03.317837
ae_1788405363317_xwf2mq	ar_1788405363307_ojm1my	usr_1788405363233_jmtosk	present		2026-09-03 08:46:03.318853	2026-09-03 08:46:03.318853
ae_1788405363320_jmu1cd	ar_1788405363319_rapyvb	usr_1788361696558_4x5g	late	Came in 10 min late	2026-09-03 08:46:03.321899	2026-09-03 08:46:03.321899
ae_1788405363321_9gavmy	ar_1788405363319_rapyvb	usr_1788405363182_d7rnj8	late	Came in 10 min late	2026-09-03 08:46:03.322995	2026-09-03 08:46:03.322995
ae_1788405363322_gldhch	ar_1788405363319_rapyvb	usr_1788405363217_tj8o9z	absent	Absent without notice	2026-09-03 08:46:03.324088	2026-09-03 08:46:03.324088
ae_1788405363324_l23ang	ar_1788405363319_rapyvb	usr_1788405363220_sok6dj	present		2026-09-03 08:46:03.325282	2026-09-03 08:46:03.325282
ae_1788405363325_r77ar5	ar_1788405363319_rapyvb	usr_1788405363222_lhyvtz	present		2026-09-03 08:46:03.326409	2026-09-03 08:46:03.326409
ae_1788405363326_eh1r2j	ar_1788405363319_rapyvb	usr_1788405363224_3e7k3h	present		2026-09-03 08:46:03.327383	2026-09-03 08:46:03.327383
ae_1788405363327_fofg76	ar_1788405363319_rapyvb	usr_1788405363227_24ccwl	present		2026-09-03 08:46:03.328388	2026-09-03 08:46:03.328388
ae_1788405363328_3n7dsr	ar_1788405363319_rapyvb	usr_1788405363229_c4a1z0	present		2026-09-03 08:46:03.329404	2026-09-03 08:46:03.329404
ae_1788405363329_dicbin	ar_1788405363319_rapyvb	usr_1788405363231_ubswfh	present		2026-09-03 08:46:03.330576	2026-09-03 08:46:03.330576
ae_1788405363331_01nzj3	ar_1788405363319_rapyvb	usr_1788405363233_jmtosk	present		2026-09-03 08:46:03.332688	2026-09-03 08:46:03.332688
ae_1789459804772_w8wvzi	ar_1789459804769_fdk40q	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:04.772	2026-09-15 08:10:04.772
ae_1789459804776_efeghj	ar_1789459804769_fdk40q	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:04.776	2026-09-15 08:10:04.776
ae_1789459804778_l381nj	ar_1789459804769_fdk40q	usr_1788405363220_sok6dj	present		2026-09-15 08:10:04.778	2026-09-15 08:10:04.778
ae_1789459804780_pzja9x	ar_1789459804769_fdk40q	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:04.78	2026-09-15 08:10:04.78
ae_1789459804782_dt8y6o	ar_1789459804769_fdk40q	usr_1788361696558_4x5g	absent		2026-09-15 08:10:04.782	2026-09-15 08:10:04.782
ae_1789459804783_c9ffvs	ar_1789459804769_fdk40q	usr_1788405363224_3e7k3h	late		2026-09-15 08:10:04.783	2026-09-15 08:10:04.783
ae_1789459804785_bzp804	ar_1789459804769_fdk40q	usr_1788405363227_24ccwl	present		2026-09-15 08:10:04.785	2026-09-15 08:10:04.785
ae_1789459804786_480nlo	ar_1789459804769_fdk40q	usr_1788405363229_c4a1z0	present		2026-09-15 08:10:04.786	2026-09-15 08:10:04.786
ae_1789459804788_leknvb	ar_1789459804769_fdk40q	usr_1788405363231_ubswfh	present		2026-09-15 08:10:04.788	2026-09-15 08:10:04.788
ae_1789459804790_xexdaz	ar_1789459804769_fdk40q	usr_1788405363233_jmtosk	present		2026-09-15 08:10:04.79	2026-09-15 08:10:04.79
ae_1789459804794_3rm4lc	ar_1789459804793_lf9abm	usr_1788405363182_d7rnj8	absent		2026-09-15 08:10:04.794	2026-09-15 08:10:04.794
ae_1789459804796_800rz4	ar_1789459804793_lf9abm	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:04.796	2026-09-15 08:10:04.796
ae_1789459804798_i0j2bq	ar_1789459804793_lf9abm	usr_1788405363220_sok6dj	present		2026-09-15 08:10:04.798	2026-09-15 08:10:04.798
ae_1789459804799_jljica	ar_1789459804793_lf9abm	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:04.799	2026-09-15 08:10:04.799
ae_1789459804800_el1bkw	ar_1789459804793_lf9abm	usr_1788361696558_4x5g	absent		2026-09-15 08:10:04.8	2026-09-15 08:10:04.8
ae_1789459804802_en9fz5	ar_1789459804793_lf9abm	usr_1788405363224_3e7k3h	present		2026-09-15 08:10:04.802	2026-09-15 08:10:04.802
ae_1789459804804_j5ogoz	ar_1789459804793_lf9abm	usr_1788405363227_24ccwl	present		2026-09-15 08:10:04.804	2026-09-15 08:10:04.804
ae_1789459804805_l6nfjo	ar_1789459804793_lf9abm	usr_1788405363229_c4a1z0	present		2026-09-15 08:10:04.805	2026-09-15 08:10:04.805
ae_1789459804807_xu6hiq	ar_1789459804793_lf9abm	usr_1788405363231_ubswfh	present		2026-09-15 08:10:04.807	2026-09-15 08:10:04.807
ae_1789459804809_rwevdb	ar_1789459804793_lf9abm	usr_1788405363233_jmtosk	present		2026-09-15 08:10:04.809	2026-09-15 08:10:04.809
ae_1789459804815_46h33t	ar_1789459804812_5t1dsj	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:04.815	2026-09-15 08:10:04.815
ae_1789459804816_6yglly	ar_1789459804812_5t1dsj	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:04.816	2026-09-15 08:10:04.816
ae_1789459804818_687bwu	ar_1789459804812_5t1dsj	usr_1788405363220_sok6dj	absent		2026-09-15 08:10:04.818	2026-09-15 08:10:04.818
ae_1789459804820_mcy7zy	ar_1789459804812_5t1dsj	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:04.82	2026-09-15 08:10:04.82
ae_1789459804823_n67vny	ar_1789459804812_5t1dsj	usr_1788361696558_4x5g	present		2026-09-15 08:10:04.823	2026-09-15 08:10:04.823
ae_1789459804825_ugyq44	ar_1789459804812_5t1dsj	usr_1788405363224_3e7k3h	present		2026-09-15 08:10:04.825	2026-09-15 08:10:04.825
ae_1789459804826_wn9yhw	ar_1789459804812_5t1dsj	usr_1788405363227_24ccwl	present		2026-09-15 08:10:04.826	2026-09-15 08:10:04.826
ae_1789459804828_3h8zkn	ar_1789459804812_5t1dsj	usr_1788405363229_c4a1z0	late		2026-09-15 08:10:04.828	2026-09-15 08:10:04.828
ae_1789459804831_48qi7n	ar_1789459804812_5t1dsj	usr_1788405363231_ubswfh	absent		2026-09-15 08:10:04.831	2026-09-15 08:10:04.831
ae_1789459804833_g2srlx	ar_1789459804812_5t1dsj	usr_1788405363233_jmtosk	present		2026-09-15 08:10:04.833	2026-09-15 08:10:04.833
ae_1789459804838_5ee6g0	ar_1789459804836_x0hzpk	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:04.838	2026-09-15 08:10:04.838
ae_1789459804839_l07tyg	ar_1789459804836_x0hzpk	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:04.839	2026-09-15 08:10:04.839
ae_1789459804841_45bdx0	ar_1789459804836_x0hzpk	usr_1788405363220_sok6dj	present		2026-09-15 08:10:04.841	2026-09-15 08:10:04.841
ae_1789459804842_8t1bn5	ar_1789459804836_x0hzpk	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:04.842	2026-09-15 08:10:04.842
ae_1789459804844_34ogqa	ar_1789459804836_x0hzpk	usr_1788361696558_4x5g	present		2026-09-15 08:10:04.844	2026-09-15 08:10:04.844
ae_1789459804846_n73i3i	ar_1789459804836_x0hzpk	usr_1788405363224_3e7k3h	present		2026-09-15 08:10:04.846	2026-09-15 08:10:04.846
ae_1789459804847_wgus24	ar_1789459804836_x0hzpk	usr_1788405363227_24ccwl	present		2026-09-15 08:10:04.847	2026-09-15 08:10:04.847
ae_1789459804849_4wyxvf	ar_1789459804836_x0hzpk	usr_1788405363229_c4a1z0	present		2026-09-15 08:10:04.849	2026-09-15 08:10:04.849
ae_1789459804850_14pmxi	ar_1789459804836_x0hzpk	usr_1788405363231_ubswfh	present		2026-09-15 08:10:04.85	2026-09-15 08:10:04.85
ae_1789459804852_ct4hgd	ar_1789459804836_x0hzpk	usr_1788405363233_jmtosk	present		2026-09-15 08:10:04.852	2026-09-15 08:10:04.852
ae_1789459804857_8rhdha	ar_1789459804855_c9akid	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:04.857	2026-09-15 08:10:04.857
ae_1789459804859_lhirps	ar_1789459804855_c9akid	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:04.859	2026-09-15 08:10:04.859
ae_1789459804860_u9d0h9	ar_1789459804855_c9akid	usr_1788405363220_sok6dj	present		2026-09-15 08:10:04.86	2026-09-15 08:10:04.86
ae_1789459804862_pbs95k	ar_1789459804855_c9akid	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:04.862	2026-09-15 08:10:04.862
ae_1789459804864_98ifnl	ar_1789459804855_c9akid	usr_1788361696558_4x5g	late		2026-09-15 08:10:04.864	2026-09-15 08:10:04.864
ae_1789459804865_vatviw	ar_1789459804855_c9akid	usr_1788405363224_3e7k3h	present		2026-09-15 08:10:04.865	2026-09-15 08:10:04.865
ae_1789459804867_okjya0	ar_1789459804855_c9akid	usr_1788405363227_24ccwl	present		2026-09-15 08:10:04.867	2026-09-15 08:10:04.867
ae_1789459804869_1lobe8	ar_1789459804855_c9akid	usr_1788405363229_c4a1z0	present		2026-09-15 08:10:04.869	2026-09-15 08:10:04.869
ae_1789459804870_2jsxfx	ar_1789459804855_c9akid	usr_1788405363231_ubswfh	present		2026-09-15 08:10:04.87	2026-09-15 08:10:04.87
ae_1789459804873_0wbi7q	ar_1789459804855_c9akid	usr_1788405363233_jmtosk	present		2026-09-15 08:10:04.873	2026-09-15 08:10:04.873
ae_1789459804878_9f4qvk	ar_1789459804876_tsk20d	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:04.878	2026-09-15 08:10:04.878
ae_1789459804879_cp6o9u	ar_1789459804876_tsk20d	usr_1788405363217_tj8o9z	absent		2026-09-15 08:10:04.879	2026-09-15 08:10:04.879
ae_1789459804881_ptvyi5	ar_1789459804876_tsk20d	usr_1788405363220_sok6dj	present		2026-09-15 08:10:04.881	2026-09-15 08:10:04.881
ae_1789459804882_7udgz8	ar_1789459804876_tsk20d	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:04.882	2026-09-15 08:10:04.882
ae_1789459804884_thkrrv	ar_1789459804876_tsk20d	usr_1788361696558_4x5g	present		2026-09-15 08:10:04.884	2026-09-15 08:10:04.884
ae_1789459804886_07kwbm	ar_1789459804876_tsk20d	usr_1788405363224_3e7k3h	present		2026-09-15 08:10:04.886	2026-09-15 08:10:04.886
ae_1789459804887_e11rmy	ar_1789459804876_tsk20d	usr_1788405363227_24ccwl	present		2026-09-15 08:10:04.887	2026-09-15 08:10:04.887
ae_1789459804889_74tx59	ar_1789459804876_tsk20d	usr_1788405363229_c4a1z0	absent		2026-09-15 08:10:04.889	2026-09-15 08:10:04.889
ae_1789459804891_24g8r8	ar_1789459804876_tsk20d	usr_1788405363231_ubswfh	present		2026-09-15 08:10:04.891	2026-09-15 08:10:04.891
ae_1789459804893_fk8ajh	ar_1789459804876_tsk20d	usr_1788405363233_jmtosk	present		2026-09-15 08:10:04.893	2026-09-15 08:10:04.893
ae_1789459804898_tv8ly8	ar_1789459804896_f9tvk8	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:04.898	2026-09-15 08:10:04.898
ae_1789459804900_63ueta	ar_1789459804896_f9tvk8	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:04.9	2026-09-15 08:10:04.9
ae_1789459804902_zrw6lr	ar_1789459804896_f9tvk8	usr_1788405363220_sok6dj	present		2026-09-15 08:10:04.902	2026-09-15 08:10:04.902
ae_1789459804903_dbrvjl	ar_1789459804896_f9tvk8	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:04.903	2026-09-15 08:10:04.903
ae_1789459804905_od4myx	ar_1789459804896_f9tvk8	usr_1788361696558_4x5g	present		2026-09-15 08:10:04.905	2026-09-15 08:10:04.905
ae_1789459804906_9thinw	ar_1789459804896_f9tvk8	usr_1788405363224_3e7k3h	present		2026-09-15 08:10:04.906	2026-09-15 08:10:04.906
ae_1789459804908_rsq0bm	ar_1789459804896_f9tvk8	usr_1788405363227_24ccwl	late		2026-09-15 08:10:04.908	2026-09-15 08:10:04.908
ae_1789459804910_47g438	ar_1789459804896_f9tvk8	usr_1788405363229_c4a1z0	present		2026-09-15 08:10:04.91	2026-09-15 08:10:04.91
ae_1789459804911_jwdrtm	ar_1789459804896_f9tvk8	usr_1788405363231_ubswfh	absent		2026-09-15 08:10:04.911	2026-09-15 08:10:04.911
ae_1789459804914_xg32df	ar_1789459804896_f9tvk8	usr_1788405363233_jmtosk	late		2026-09-15 08:10:04.914	2026-09-15 08:10:04.914
ae_1789459804919_rarbw8	ar_1789459804917_n0tx4m	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:04.919	2026-09-15 08:10:04.919
ae_1789459804921_uug4iu	ar_1789459804917_n0tx4m	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:04.921	2026-09-15 08:10:04.921
ae_1789459804922_yfdaqd	ar_1789459804917_n0tx4m	usr_1788405363220_sok6dj	present		2026-09-15 08:10:04.922	2026-09-15 08:10:04.922
ae_1789459804924_rruzb5	ar_1789459804917_n0tx4m	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:04.924	2026-09-15 08:10:04.924
ae_1789459804925_qy9p8b	ar_1789459804917_n0tx4m	usr_1788361696558_4x5g	present		2026-09-15 08:10:04.925	2026-09-15 08:10:04.925
ae_1789459804927_94ozbq	ar_1789459804917_n0tx4m	usr_1788405363224_3e7k3h	present		2026-09-15 08:10:04.927	2026-09-15 08:10:04.927
ae_1789459804928_0zj1ma	ar_1789459804917_n0tx4m	usr_1788405363227_24ccwl	present		2026-09-15 08:10:04.928	2026-09-15 08:10:04.928
ae_1789459804930_6v8m2c	ar_1789459804917_n0tx4m	usr_1788405363229_c4a1z0	present		2026-09-15 08:10:04.93	2026-09-15 08:10:04.93
ae_1789459804932_r2wf3i	ar_1789459804917_n0tx4m	usr_1788405363231_ubswfh	present		2026-09-15 08:10:04.932	2026-09-15 08:10:04.932
ae_1789459804934_iqacqo	ar_1789459804917_n0tx4m	usr_1788405363233_jmtosk	present		2026-09-15 08:10:04.934	2026-09-15 08:10:04.934
ae_1789459804940_o65zj5	ar_1789459804938_11d2vo	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:04.94	2026-09-15 08:10:04.94
ae_1789459804942_anltw0	ar_1789459804938_11d2vo	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:04.942	2026-09-15 08:10:04.942
ae_1789459804943_g2ye7c	ar_1789459804938_11d2vo	usr_1788405363220_sok6dj	present		2026-09-15 08:10:04.943	2026-09-15 08:10:04.943
ae_1789459804945_bmdv1e	ar_1789459804938_11d2vo	usr_1788405363222_lhyvtz	late		2026-09-15 08:10:04.945	2026-09-15 08:10:04.945
ae_1789459804947_iov5lc	ar_1789459804938_11d2vo	usr_1788361696558_4x5g	present		2026-09-15 08:10:04.947	2026-09-15 08:10:04.947
ae_1789459804948_ou8jc8	ar_1789459804938_11d2vo	usr_1788405363224_3e7k3h	present		2026-09-15 08:10:04.948	2026-09-15 08:10:04.948
ae_1789459804950_67b0yr	ar_1789459804938_11d2vo	usr_1788405363227_24ccwl	absent		2026-09-15 08:10:04.95	2026-09-15 08:10:04.95
ae_1789459804952_xtnx32	ar_1789459804938_11d2vo	usr_1788405363229_c4a1z0	present		2026-09-15 08:10:04.952	2026-09-15 08:10:04.952
ae_1789459804954_p1bk2z	ar_1789459804938_11d2vo	usr_1788405363231_ubswfh	present		2026-09-15 08:10:04.954	2026-09-15 08:10:04.954
ae_1789459804956_ke56gn	ar_1789459804938_11d2vo	usr_1788405363233_jmtosk	present		2026-09-15 08:10:04.956	2026-09-15 08:10:04.956
ae_1789459804960_oypn0l	ar_1789459804959_rfx1fa	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:04.96	2026-09-15 08:10:04.96
ae_1789459804962_leqqef	ar_1789459804959_rfx1fa	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:04.962	2026-09-15 08:10:04.962
ae_1789459804964_qq6qme	ar_1789459804959_rfx1fa	usr_1788405363220_sok6dj	present		2026-09-15 08:10:04.964	2026-09-15 08:10:04.964
ae_1789459804965_exvkp2	ar_1789459804959_rfx1fa	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:04.966	2026-09-15 08:10:04.966
ae_1789459804967_u0yuz2	ar_1789459804959_rfx1fa	usr_1788361696558_4x5g	present		2026-09-15 08:10:04.967	2026-09-15 08:10:04.967
ae_1789459804969_pn6vye	ar_1789459804959_rfx1fa	usr_1788405363224_3e7k3h	present		2026-09-15 08:10:04.969	2026-09-15 08:10:04.969
ae_1789459804970_e77hcl	ar_1789459804959_rfx1fa	usr_1788405363227_24ccwl	present		2026-09-15 08:10:04.97	2026-09-15 08:10:04.97
ae_1789459804972_sftdbr	ar_1789459804959_rfx1fa	usr_1788405363229_c4a1z0	late		2026-09-15 08:10:04.972	2026-09-15 08:10:04.972
ae_1789459804973_dr4n66	ar_1789459804959_rfx1fa	usr_1788405363231_ubswfh	present		2026-09-15 08:10:04.973	2026-09-15 08:10:04.973
ae_1789459804974_ktq6rj	ar_1789459804959_rfx1fa	usr_1788405363233_jmtosk	present		2026-09-15 08:10:04.974	2026-09-15 08:10:04.974
ae_1789459804980_ewsxu3	ar_1789459804978_r58j8w	usr_1788405363182_d7rnj8	absent		2026-09-15 08:10:04.98	2026-09-15 08:10:04.98
ae_1789459804982_ruu7ls	ar_1789459804978_r58j8w	usr_1788405363217_tj8o9z	late		2026-09-15 08:10:04.982	2026-09-15 08:10:04.982
ae_1789459804983_kn0oww	ar_1789459804978_r58j8w	usr_1788405363220_sok6dj	present		2026-09-15 08:10:04.983	2026-09-15 08:10:04.983
ae_1789459804984_8xocjz	ar_1789459804978_r58j8w	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:04.984	2026-09-15 08:10:04.984
ae_1789459804986_i3eqzu	ar_1789459804978_r58j8w	usr_1788361696558_4x5g	present		2026-09-15 08:10:04.986	2026-09-15 08:10:04.986
ae_1789459804987_pf0j43	ar_1789459804978_r58j8w	usr_1788405363224_3e7k3h	present		2026-09-15 08:10:04.987	2026-09-15 08:10:04.987
ae_1789459804989_oqc048	ar_1789459804978_r58j8w	usr_1788405363227_24ccwl	present		2026-09-15 08:10:04.989	2026-09-15 08:10:04.989
ae_1789459804991_v7o6yi	ar_1789459804978_r58j8w	usr_1788405363229_c4a1z0	present		2026-09-15 08:10:04.991	2026-09-15 08:10:04.991
ae_1789459804992_8sd4ho	ar_1789459804978_r58j8w	usr_1788405363231_ubswfh	late		2026-09-15 08:10:04.992	2026-09-15 08:10:04.992
ae_1789459804994_hlkzp8	ar_1789459804978_r58j8w	usr_1788405363233_jmtosk	present		2026-09-15 08:10:04.994	2026-09-15 08:10:04.994
ae_1789459805000_ojlg83	ar_1789459804998_77gk82	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:05	2026-09-15 08:10:05
ae_1789459805001_motby5	ar_1789459804998_77gk82	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:05.001	2026-09-15 08:10:05.001
ae_1789459805003_h0o1s4	ar_1789459804998_77gk82	usr_1788405363220_sok6dj	present		2026-09-15 08:10:05.003	2026-09-15 08:10:05.003
ae_1789459805005_hmpe4x	ar_1789459804998_77gk82	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:05.005	2026-09-15 08:10:05.005
ae_1789459805006_bl9al2	ar_1789459804998_77gk82	usr_1788361696558_4x5g	present		2026-09-15 08:10:05.006	2026-09-15 08:10:05.006
ae_1789459805008_kb8t26	ar_1789459804998_77gk82	usr_1788405363224_3e7k3h	late		2026-09-15 08:10:05.008	2026-09-15 08:10:05.008
ae_1789459805010_awwp1o	ar_1789459804998_77gk82	usr_1788405363227_24ccwl	present		2026-09-15 08:10:05.01	2026-09-15 08:10:05.01
ae_1789459805011_19w6u4	ar_1789459804998_77gk82	usr_1788405363229_c4a1z0	absent		2026-09-15 08:10:05.011	2026-09-15 08:10:05.011
ae_1789459805013_nxwk4a	ar_1789459804998_77gk82	usr_1788405363231_ubswfh	present		2026-09-15 08:10:05.013	2026-09-15 08:10:05.013
ae_1789459805015_3rn6cb	ar_1789459804998_77gk82	usr_1788405363233_jmtosk	present		2026-09-15 08:10:05.015	2026-09-15 08:10:05.015
ae_1789459805019_copgsy	ar_1789459805018_v53ayf	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:05.019	2026-09-15 08:10:05.019
ae_1789459805021_y53gn4	ar_1789459805018_v53ayf	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:05.021	2026-09-15 08:10:05.021
ae_1789459805023_4jetg4	ar_1789459805018_v53ayf	usr_1788405363220_sok6dj	present		2026-09-15 08:10:05.023	2026-09-15 08:10:05.023
ae_1789459805024_hpi77g	ar_1789459805018_v53ayf	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:05.024	2026-09-15 08:10:05.024
ae_1789459805026_b2jb2t	ar_1789459805018_v53ayf	usr_1788361696558_4x5g	present		2026-09-15 08:10:05.026	2026-09-15 08:10:05.026
ae_1789459805028_p6xiw1	ar_1789459805018_v53ayf	usr_1788405363224_3e7k3h	present		2026-09-15 08:10:05.028	2026-09-15 08:10:05.028
ae_1789459805029_lnezk2	ar_1789459805018_v53ayf	usr_1788405363227_24ccwl	present		2026-09-15 08:10:05.029	2026-09-15 08:10:05.029
ae_1789459805031_wfqvql	ar_1789459805018_v53ayf	usr_1788405363229_c4a1z0	present		2026-09-15 08:10:05.031	2026-09-15 08:10:05.031
ae_1789459805032_b0temj	ar_1789459805018_v53ayf	usr_1788405363231_ubswfh	present		2026-09-15 08:10:05.032	2026-09-15 08:10:05.032
ae_1789459805034_7ankjz	ar_1789459805018_v53ayf	usr_1788405363233_jmtosk	present		2026-09-15 08:10:05.034	2026-09-15 08:10:05.034
ae_1789459805039_km6eyq	ar_1789459805037_z7eai7	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:05.039	2026-09-15 08:10:05.039
ae_1789459805040_cpyfit	ar_1789459805037_z7eai7	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:05.04	2026-09-15 08:10:05.04
ae_1789459805042_p4uojq	ar_1789459805037_z7eai7	usr_1788405363220_sok6dj	present		2026-09-15 08:10:05.042	2026-09-15 08:10:05.042
ae_1789459805044_mklpa1	ar_1789459805037_z7eai7	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:05.044	2026-09-15 08:10:05.044
ae_1789459805045_rtjki2	ar_1789459805037_z7eai7	usr_1788361696558_4x5g	present		2026-09-15 08:10:05.045	2026-09-15 08:10:05.045
ae_1789459805047_s1kqzt	ar_1789459805037_z7eai7	usr_1788405363224_3e7k3h	absent		2026-09-15 08:10:05.047	2026-09-15 08:10:05.047
ae_1789459805048_5xcjpl	ar_1789459805037_z7eai7	usr_1788405363227_24ccwl	late		2026-09-15 08:10:05.049	2026-09-15 08:10:05.049
ae_1789459805050_kesg2a	ar_1789459805037_z7eai7	usr_1788405363229_c4a1z0	present		2026-09-15 08:10:05.05	2026-09-15 08:10:05.05
ae_1789459805051_1vjpjm	ar_1789459805037_z7eai7	usr_1788405363231_ubswfh	present		2026-09-15 08:10:05.051	2026-09-15 08:10:05.051
ae_1789459805053_8lqlym	ar_1789459805037_z7eai7	usr_1788405363233_jmtosk	present		2026-09-15 08:10:05.053	2026-09-15 08:10:05.053
ae_1789459805057_rudz0t	ar_1789459805056_6q2gvf	usr_1788405363182_d7rnj8	present		2026-09-15 08:10:05.057	2026-09-15 08:10:05.057
ae_1789459805059_9hoovt	ar_1789459805056_6q2gvf	usr_1788405363217_tj8o9z	present		2026-09-15 08:10:05.059	2026-09-15 08:10:05.059
ae_1789459805061_gaob2p	ar_1789459805056_6q2gvf	usr_1788405363220_sok6dj	present		2026-09-15 08:10:05.061	2026-09-15 08:10:05.061
ae_1789459805062_4376d9	ar_1789459805056_6q2gvf	usr_1788405363222_lhyvtz	present		2026-09-15 08:10:05.062	2026-09-15 08:10:05.062
ae_1789459805064_okawxn	ar_1789459805056_6q2gvf	usr_1788361696558_4x5g	present		2026-09-15 08:10:05.064	2026-09-15 08:10:05.064
ae_1789459805066_8nzmt5	ar_1789459805056_6q2gvf	usr_1788405363224_3e7k3h	present		2026-09-15 08:10:05.066	2026-09-15 08:10:05.066
ae_1789459805068_lbi4sl	ar_1789459805056_6q2gvf	usr_1788405363227_24ccwl	present		2026-09-15 08:10:05.068	2026-09-15 08:10:05.068
ae_1789459805070_4f55ma	ar_1789459805056_6q2gvf	usr_1788405363229_c4a1z0	absent		2026-09-15 08:10:05.07	2026-09-15 08:10:05.07
ae_1789459805071_72t8oi	ar_1789459805056_6q2gvf	usr_1788405363231_ubswfh	present		2026-09-15 08:10:05.071	2026-09-15 08:10:05.071
ae_1789459805073_zpx75o	ar_1789459805056_6q2gvf	usr_1788405363233_jmtosk	present		2026-09-15 08:10:05.073	2026-09-15 08:10:05.073
\.


--
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_records (id, institution_code, timetable_slot_id, date, taken_by_teacher_id, status, submitted_at, locked_at, created_at, updated_at) FROM stdin;
ar_1788405363246_1oots3	TST001	ts_1788405271289_xiuznt	2026-09-03	usr_1787066287949_dsdty	submitted	2026-09-03 08:46:03.247858	\N	2026-09-03 08:46:03.247858	2026-09-03 08:46:03.247858
ar_1788405363307_ojm1my	TST001	ts_1788405271289_xiuznt	2026-09-02	usr_1787066287949_dsdty	submitted	2026-09-03 08:46:03.308806	\N	2026-09-03 08:46:03.308806	2026-09-03 08:46:03.308806
ar_1788405363319_rapyvb	TST001	ts_1788405271289_xiuznt	2026-09-01	usr_1787066287949_dsdty	submitted	2026-09-03 08:46:03.320846	\N	2026-09-03 08:46:03.320846	2026-09-03 08:46:03.320846
ar_1789459804769_fdk40q	TST001	ts_1788405271284_wbtmoe	2026-09-14	usr_1788405167547_a4rct7	submitted	2026-09-15 08:10:04.769	\N	2026-09-15 08:10:04.769	2026-09-15 08:10:04.769
ar_1789459804793_lf9abm	TST001	ts_1788405271286_eo693h	2026-09-14	usr_1788405167553_kdqona	submitted	2026-09-15 08:10:04.793	\N	2026-09-15 08:10:04.793	2026-09-15 08:10:04.793
ar_1789459804812_5t1dsj	TST001	ts_1788405271287_av3dmg	2026-09-14	usr_1788405167556_jrwyaj	submitted	2026-09-15 08:10:04.812	\N	2026-09-15 08:10:04.812	2026-09-15 08:10:04.812
ar_1789459804836_x0hzpk	TST001	ts_1788405271284_wbtmoe	2026-09-11	usr_1788405167547_a4rct7	submitted	2026-09-15 08:10:04.836	\N	2026-09-15 08:10:04.836	2026-09-15 08:10:04.836
ar_1789459804855_c9akid	TST001	ts_1788405271286_eo693h	2026-09-11	usr_1788405167553_kdqona	submitted	2026-09-15 08:10:04.855	\N	2026-09-15 08:10:04.855	2026-09-15 08:10:04.855
ar_1789459804876_tsk20d	TST001	ts_1788405271287_av3dmg	2026-09-11	usr_1788405167556_jrwyaj	submitted	2026-09-15 08:10:04.876	\N	2026-09-15 08:10:04.876	2026-09-15 08:10:04.876
ar_1789459804896_f9tvk8	TST001	ts_1788405271284_wbtmoe	2026-09-10	usr_1788405167547_a4rct7	submitted	2026-09-15 08:10:04.896	\N	2026-09-15 08:10:04.896	2026-09-15 08:10:04.896
ar_1789459804917_n0tx4m	TST001	ts_1788405271286_eo693h	2026-09-10	usr_1788405167553_kdqona	submitted	2026-09-15 08:10:04.917	\N	2026-09-15 08:10:04.917	2026-09-15 08:10:04.917
ar_1789459804938_11d2vo	TST001	ts_1788405271287_av3dmg	2026-09-10	usr_1788405167556_jrwyaj	submitted	2026-09-15 08:10:04.938	\N	2026-09-15 08:10:04.938	2026-09-15 08:10:04.938
ar_1789459804959_rfx1fa	TST001	ts_1788405271284_wbtmoe	2026-09-09	usr_1788405167547_a4rct7	submitted	2026-09-15 08:10:04.959	\N	2026-09-15 08:10:04.959	2026-09-15 08:10:04.959
ar_1789459804978_r58j8w	TST001	ts_1788405271286_eo693h	2026-09-09	usr_1788405167553_kdqona	submitted	2026-09-15 08:10:04.978	\N	2026-09-15 08:10:04.978	2026-09-15 08:10:04.978
ar_1789459804998_77gk82	TST001	ts_1788405271287_av3dmg	2026-09-09	usr_1788405167556_jrwyaj	submitted	2026-09-15 08:10:04.998	\N	2026-09-15 08:10:04.998	2026-09-15 08:10:04.998
ar_1789459805018_v53ayf	TST001	ts_1788405271284_wbtmoe	2026-09-08	usr_1788405167547_a4rct7	submitted	2026-09-15 08:10:05.018	\N	2026-09-15 08:10:05.018	2026-09-15 08:10:05.018
ar_1789459805037_z7eai7	TST001	ts_1788405271286_eo693h	2026-09-08	usr_1788405167553_kdqona	submitted	2026-09-15 08:10:05.037	\N	2026-09-15 08:10:05.037	2026-09-15 08:10:05.037
ar_1789459805056_6q2gvf	TST001	ts_1788405271287_av3dmg	2026-09-08	usr_1788405167556_jrwyaj	submitted	2026-09-15 08:10:05.056	\N	2026-09-15 08:10:05.056	2026-09-15 08:10:05.056
\.


--
-- Data for Name: class_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.class_sections (id, institution_code, name, department, academic_year, section, class_teacher_id, created_at, updated_at) FROM stdin;
cs_1788379055324_gux95b	TST001	Class 6 A	Class 6	A	A	usr_1787066287949_dsdty	2026-09-03 01:27:35.325055	2026-09-03 01:27:35.325055
cs_1788379813902_lpqnrm	TST001	Class 1 A	Class 1	A	A	usr_1788405167553_kdqona	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_asplq6	TST001	Class 1 B	Class 1	B	B	usr_1788405167556_jrwyaj	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_8aos6q	TST001	Class 1 C	Class 1	C	C	usr_1788405167559_qug6ew	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_8kp4xj	TST001	Class 10 A	Class 10	A	A	usr_1788405167547_a4rct7	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_qust8w	TST001	Class 10 B	Class 10	B	B	usr_1787066287949_dsdty	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_nc4cnr	TST001	Class 10 C	Class 10	C	C	usr_1788405167553_kdqona	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_7cjfxs	TST001	Class 2 A	Class 2	A	A	usr_1788405167556_jrwyaj	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_spui5n	TST001	Class 2 B	Class 2	B	B	usr_1788405167559_qug6ew	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_u6eoo4	TST001	Class 2 C	Class 2	C	C	usr_1788405167547_a4rct7	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_ibviof	TST001	Class 3 A	Class 3	A	A	usr_1787066287949_dsdty	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_gdp0lk	TST001	Class 3 B	Class 3	B	B	usr_1788405167553_kdqona	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_3w01fg	TST001	Class 3 C	Class 3	C	C	usr_1788405167556_jrwyaj	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_m3ftwm	TST001	Class 4 A	Class 4	A	A	usr_1788405167559_qug6ew	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_zinqy5	TST001	Class 4 B	Class 4	B	B	usr_1788405167547_a4rct7	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_qm1ysd	TST001	Class 4 C	Class 4	C	C	usr_1787066287949_dsdty	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1787131796064_96rs2lu	TST001	Class 5 A	Class 5	A	A	usr_1788405167553_kdqona	2026-08-19 14:59:56.188024	2026-08-19 14:59:56.188024
cs_1788379813902_pft59u	TST001	Class 5 B	Class 5	B	B	usr_1788405167556_jrwyaj	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_2bd9zr	TST001	Class 5 C	Class 5	C	C	usr_1788405167559_qug6ew	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_zzyr9e	TST001	Class 6 B	Class 6	B	B	usr_1788405167547_a4rct7	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_7kz6cp	TST001	Class 6 C	Class 6	C	C	usr_1787066287949_dsdty	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_2dewmf	TST001	Class 7 A	Class 7	A	A	usr_1788405167553_kdqona	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_r5wr0l	TST001	Class 7 B	Class 7	B	B	usr_1788405167556_jrwyaj	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_pev05o	TST001	Class 7 C	Class 7	C	C	usr_1788405167559_qug6ew	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_lhp6q2	TST001	Class 8 A	Class 8	A	A	usr_1788405167547_a4rct7	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_pwotnk	TST001	Class 8 B	Class 8	B	B	usr_1787066287949_dsdty	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_23no86	TST001	Class 8 C	Class 8	C	C	usr_1788405167553_kdqona	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_ewt5n5	TST001	Class 9 A	Class 9	A	A	usr_1788405167556_jrwyaj	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_zk0e5a	TST001	Class 9 B	Class 9	B	B	usr_1788405167559_qug6ew	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
cs_1788379813902_qtd5xm	TST001	Class 9 C	Class 9	C	C	usr_1788405167547_a4rct7	2026-09-03 01:40:13.912235	2026-09-03 01:40:13.912235
\.


--
-- Data for Name: exam_subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exam_subjects (id, exam_id, institution_code, subject_id, max_marks, pass_marks, created_at) FROM stdin;
es_1788418689386_n10y7k	ex_1788418689376_37y5w6	TST001	sub_1787131796064_2zi0ihg	100	35	2026-09-03 12:28:09.392773
es_1788418689417_66jk71	ex_1788418689376_37y5w6	TST001	sub_1787131796064_68d2dw2	100	35	2026-09-03 12:28:09.424052
es_1788418689431_wf5cvz	ex_1788418689376_37y5w6	TST001	sub_1787131796064_a9u1gx2	100	35	2026-09-03 12:28:09.437323
es_1788418689444_t7d8zk	ex_1788418689376_37y5w6	TST001	sub_1787131796064_4t8sows	100	35	2026-09-03 12:28:09.45087
es_1788418689459_6ad0ly	ex_1788418689376_37y5w6	TST001	sub_1787131796064_u1quznz	100	35	2026-09-03 12:28:09.465743
es_n6ncui_0ihg	exam_1789459804296_n6ncui	TST001	sub_1787131796064_2zi0ihg	100	35	2026-09-15 08:10:04.298
es_n6ncui_2dw2	exam_1789459804296_n6ncui	TST001	sub_1787131796064_68d2dw2	100	35	2026-09-15 08:10:04.301
es_n6ncui_1gx2	exam_1789459804296_n6ncui	TST001	sub_1787131796064_a9u1gx2	100	35	2026-09-15 08:10:04.303
es_n6ncui_sows	exam_1789459804296_n6ncui	TST001	sub_1787131796064_4t8sows	100	35	2026-09-15 08:10:04.304
es_n6ncui_uznz	exam_1789459804296_n6ncui	TST001	sub_1787131796064_u1quznz	100	35	2026-09-15 08:10:04.306
es_oj63yl_0ihg	exam_1789459804308_oj63yl	TST001	sub_1787131796064_2zi0ihg	100	35	2026-09-15 08:10:04.309
es_oj63yl_2dw2	exam_1789459804308_oj63yl	TST001	sub_1787131796064_68d2dw2	100	35	2026-09-15 08:10:04.311
es_oj63yl_1gx2	exam_1789459804308_oj63yl	TST001	sub_1787131796064_a9u1gx2	100	35	2026-09-15 08:10:04.313
es_oj63yl_sows	exam_1789459804308_oj63yl	TST001	sub_1787131796064_4t8sows	100	35	2026-09-15 08:10:04.316
es_oj63yl_uznz	exam_1789459804308_oj63yl	TST001	sub_1787131796064_u1quznz	100	35	2026-09-15 08:10:04.318
\.


--
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exams (id, institution_code, name, term, academic_year, start_date, end_date, status, created_by, created_at, updated_at) FROM stdin;
ex_1788418689376_37y5w6	TST001	Unit Test 1	Term 1	2026-2027	2026-09-01	2026-09-05	published	usr_1787066287949_dsdty	2026-09-03 12:28:09.382676	2026-09-03 12:28:09.382676
exam_1789459804296_n6ncui	TST001	Mid-Term Exam	Term 1		\N	\N	draft	usr_1788405167553_kdqona	2026-09-15 08:10:04.296	2026-09-15 08:10:04.296
exam_1789459804308_oj63yl	TST001	Unit Test 2	Term 2		\N	\N	draft	usr_1788405167553_kdqona	2026-09-15 08:10:04.308	2026-09-15 08:10:04.308
\.


--
-- Data for Name: fee_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fee_payments (id, institution_code, fee_structure_id, student_id, amount, payment_method, payment_date, status, receipt_no, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: fee_structures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fee_structures (id, institution_code, class_section_id, title, category, amount, term, academic_year, due_date, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: homework; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.homework (id, institution_code, class_section_id, subject_id, teacher_id, title, description, due_date, assigned_date, priority, status, attachments, created_by, created_at, updated_at) FROM stdin;
hw_1789459932485_z9c0kp	TST001	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	usr_1788405167553_kdqona	Mathematics Worksheet - Fractions	Complete exercises 1-15 from Chapter 3. Show all working.	2026-09-18	2024-01-01	high	active	[]	usr_1788405167553_kdqona	2026-09-15 08:12:12.485	2026-09-15 08:12:12.485
hw_1789459932494_uy23hg	TST001	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	usr_1788405167553_kdqona	English Essay Writing	Write a 300-word essay on "My Favorite Festival".	2026-09-20	2024-01-01	medium	active	[]	usr_1788405167553_kdqona	2026-09-15 08:12:12.494	2026-09-15 08:12:12.494
hw_1789459932496_2k1bdg	TST001	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	usr_1788405167553_kdqona	Science Lab Report	Write observations for the photosynthesis experiment.	2026-09-17	2024-01-01	high	active	[]	usr_1788405167553_kdqona	2026-09-15 08:12:12.496	2026-09-15 08:12:12.496
hw_1789459932499_9e2pon	TST001	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	Social Studies Map Work	Label all states and capitals on the blank map.	2026-09-22	2024-01-01	low	active	[]	usr_1788405167553_kdqona	2026-09-15 08:12:12.499	2026-09-15 08:12:12.499
hw_1789459932501_15b5gb	TST001	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	usr_1788405167553_kdqona	Computer Science - HTML Project	Create a personal webpage using HTML.	2026-09-19	2024-01-01	medium	active	[]	usr_1788405167553_kdqona	2026-09-15 08:12:12.501	2026-09-15 08:12:12.501
\.


--
-- Data for Name: institutions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.institutions (id, institution_code, institution_name, institution_type, subscription_status, created_at, updated_at, departments, academic_years, courses, terms, blocked_dates) FROM stdin;
inst_1787065448837_8qn5h	TST001	Test School	school	active	2026-08-18 15:04:08.837	2026-08-18 15:04:08.837	["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"]	["A", "B", "C"]	[]	[]	[]
\.


--
-- Data for Name: marks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.marks (id, exam_id, exam_subject_id, institution_code, student_id, class_section_id, subject_id, marks_obtained, grade, remarks, entered_by, entered_at, updated_at) FROM stdin;
mk_1788418689393_43hewu	ex_1788418689376_37y5w6	es_1788418689386_n10y7k	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	79.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.400456	2026-09-03 12:28:09.400456
mk_1788418689403_17l1ng	ex_1788418689376_37y5w6	es_1788418689386_n10y7k	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	74.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.409885	2026-09-03 12:28:09.409885
mk_1788418689404_xu4zke	ex_1788418689376_37y5w6	es_1788418689386_n10y7k	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	81.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.411255	2026-09-03 12:28:09.411255
mk_1788418689406_5j5i2y	ex_1788418689376_37y5w6	es_1788418689386_n10y7k	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	88.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.412801	2026-09-03 12:28:09.412801
mk_1788418689408_wevo3l	ex_1788418689376_37y5w6	es_1788418689386_n10y7k	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	60.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.414676	2026-09-03 12:28:09.414676
mk_1788418689409_m1fe8y	ex_1788418689376_37y5w6	es_1788418689386_n10y7k	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	67.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.416275	2026-09-03 12:28:09.416275
mk_1788418689411_qmbod6	ex_1788418689376_37y5w6	es_1788418689386_n10y7k	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	74.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.417342	2026-09-03 12:28:09.417342
mk_1788418689412_6vplwe	ex_1788418689376_37y5w6	es_1788418689386_n10y7k	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	81.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.418469	2026-09-03 12:28:09.418469
mk_1788418689415_8h6qft	ex_1788418689376_37y5w6	es_1788418689386_n10y7k	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	88.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.421555	2026-09-03 12:28:09.421555
mk_1788418689416_f3gh9o	ex_1788418689376_37y5w6	es_1788418689386_n10y7k	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	60.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.422848	2026-09-03 12:28:09.422848
mk_1788418689419_f3sgwp	ex_1788418689376_37y5w6	es_1788418689417_66jk71	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	90.00	A+		usr_1787066287949_dsdty	2026-09-03 12:28:09.425226	2026-09-03 12:28:09.425226
mk_1788418689420_wvgath	ex_1788418689376_37y5w6	es_1788418689417_66jk71	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	85.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.426541	2026-09-03 12:28:09.426541
mk_1788418689421_x15ep2	ex_1788418689376_37y5w6	es_1788418689417_66jk71	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	92.00	A+		usr_1787066287949_dsdty	2026-09-03 12:28:09.427724	2026-09-03 12:28:09.427724
mk_1788418689422_s1vv4q	ex_1788418689376_37y5w6	es_1788418689417_66jk71	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	64.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.428881	2026-09-03 12:28:09.428881
mk_1788418689423_waujq3	ex_1788418689376_37y5w6	es_1788418689417_66jk71	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	71.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.430007	2026-09-03 12:28:09.430007
mk_1788418689425_2sxe60	ex_1788418689376_37y5w6	es_1788418689417_66jk71	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	78.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.431443	2026-09-03 12:28:09.431443
mk_1788418689426_81lk2r	ex_1788418689376_37y5w6	es_1788418689417_66jk71	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	85.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.43281	2026-09-03 12:28:09.43281
mk_1788418689427_set6na	ex_1788418689376_37y5w6	es_1788418689417_66jk71	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	92.00	A+		usr_1787066287949_dsdty	2026-09-03 12:28:09.433974	2026-09-03 12:28:09.433974
mk_1788418689428_bt08db	ex_1788418689376_37y5w6	es_1788418689417_66jk71	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	64.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.435163	2026-09-03 12:28:09.435163
mk_1788418689430_mfleot	ex_1788418689376_37y5w6	es_1788418689417_66jk71	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	71.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.436167	2026-09-03 12:28:09.436167
mk_1788418689433_gyv534	ex_1788418689376_37y5w6	es_1788418689431_wf5cvz	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	61.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.439688	2026-09-03 12:28:09.439688
mk_1788418689434_ka8s56	ex_1788418689376_37y5w6	es_1788418689431_wf5cvz	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	68.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.440984	2026-09-03 12:28:09.440984
mk_1788418689436_qydx3y	ex_1788418689376_37y5w6	es_1788418689431_wf5cvz	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	75.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.442087	2026-09-03 12:28:09.442087
mk_1788418689437_x0wh7f	ex_1788418689376_37y5w6	es_1788418689431_wf5cvz	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	82.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.443195	2026-09-03 12:28:09.443195
mk_1788418689438_e0c8nf	ex_1788418689376_37y5w6	es_1788418689431_wf5cvz	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	89.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.444212	2026-09-03 12:28:09.444212
mk_1788418689439_5kog9w	ex_1788418689376_37y5w6	es_1788418689431_wf5cvz	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	61.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.445363	2026-09-03 12:28:09.445363
mk_1788418689440_2mi1eh	ex_1788418689376_37y5w6	es_1788418689431_wf5cvz	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	68.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.446386	2026-09-03 12:28:09.446386
mk_1788418689442_vcyp0r	ex_1788418689376_37y5w6	es_1788418689431_wf5cvz	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	75.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.44862	2026-09-03 12:28:09.44862
mk_1788418689443_sues9w	ex_1788418689376_37y5w6	es_1788418689431_wf5cvz	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	82.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.449859	2026-09-03 12:28:09.449859
mk_1788418689445_lpypxs	ex_1788418689376_37y5w6	es_1788418689444_t7d8zk	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	77.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.451981	2026-09-03 12:28:09.451981
mk_1788418689447_r17twa	ex_1788418689376_37y5w6	es_1788418689444_t7d8zk	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	72.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.453082	2026-09-03 12:28:09.453082
mk_1788418689448_hjskjg	ex_1788418689376_37y5w6	es_1788418689444_t7d8zk	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	79.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.454444	2026-09-03 12:28:09.454444
mk_1788418689449_nu49cp	ex_1788418689376_37y5w6	es_1788418689444_t7d8zk	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	86.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.455549	2026-09-03 12:28:09.455549
mk_1788418689450_333ocn	ex_1788418689376_37y5w6	es_1788418689444_t7d8zk	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	93.00	A+		usr_1787066287949_dsdty	2026-09-03 12:28:09.456684	2026-09-03 12:28:09.456684
mk_1788418689453_iw5og8	ex_1788418689376_37y5w6	es_1788418689444_t7d8zk	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	65.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.459777	2026-09-03 12:28:09.459777
mk_1788418689454_mv1n3v	ex_1788418689376_37y5w6	es_1788418689444_t7d8zk	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	72.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.461087	2026-09-03 12:28:09.461087
mk_1788418689455_j0yk5i	ex_1788418689376_37y5w6	es_1788418689444_t7d8zk	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	79.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.462159	2026-09-03 12:28:09.462159
mk_1788418689457_uwm0qg	ex_1788418689376_37y5w6	es_1788418689444_t7d8zk	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	86.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.463378	2026-09-03 12:28:09.463378
mk_1788418689458_bd62aw	ex_1788418689376_37y5w6	es_1788418689444_t7d8zk	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	93.00	A+		usr_1787066287949_dsdty	2026-09-03 12:28:09.464631	2026-09-03 12:28:09.464631
mk_1788418689460_y7vdz2	ex_1788418689376_37y5w6	es_1788418689459_6ad0ly	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	88.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.466833	2026-09-03 12:28:09.466833
mk_1788418689461_vwbbdd	ex_1788418689376_37y5w6	es_1788418689459_6ad0ly	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	83.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.467836	2026-09-03 12:28:09.467836
mk_1788418689462_f52emv	ex_1788418689376_37y5w6	es_1788418689459_6ad0ly	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	90.00	A+		usr_1787066287949_dsdty	2026-09-03 12:28:09.468975	2026-09-03 12:28:09.468975
mk_1788418689464_z24vsc	ex_1788418689376_37y5w6	es_1788418689459_6ad0ly	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	62.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.470154	2026-09-03 12:28:09.470154
mk_1788418689465_8zg0iu	ex_1788418689376_37y5w6	es_1788418689459_6ad0ly	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	69.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.471209	2026-09-03 12:28:09.471209
mk_1788418689466_gdum51	ex_1788418689376_37y5w6	es_1788418689459_6ad0ly	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	76.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.472241	2026-09-03 12:28:09.472241
mk_1788418689467_tout3g	ex_1788418689376_37y5w6	es_1788418689459_6ad0ly	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	83.00	A		usr_1787066287949_dsdty	2026-09-03 12:28:09.473399	2026-09-03 12:28:09.473399
mk_1788418689468_g5gdhu	ex_1788418689376_37y5w6	es_1788418689459_6ad0ly	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	90.00	A+		usr_1787066287949_dsdty	2026-09-03 12:28:09.47481	2026-09-03 12:28:09.47481
mk_1788418689469_ky638c	ex_1788418689376_37y5w6	es_1788418689459_6ad0ly	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	62.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.475779	2026-09-03 12:28:09.475779
mk_1788418689471_0dau0r	ex_1788418689376_37y5w6	es_1788418689459_6ad0ly	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	69.00	B		usr_1787066287949_dsdty	2026-09-03 12:28:09.478023	2026-09-03 12:28:09.478023
mk_1788418689432_acv7o2	ex_1788418689376_37y5w6	es_1788418689431_wf5cvz	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	45.00	A+		usr_1787066287949_dsdty	2026-09-03 12:28:09.438616	2026-09-03 17:17:56.074
mk_1789459804408_umlaz8	exam_1789459804296_n6ncui	es_n6ncui_0ihg	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	60.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.408	2026-09-15 08:10:04.408
mk_1789459804417_fpym7d	exam_1789459804296_n6ncui	es_n6ncui_0ihg	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	66.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.417	2026-09-15 08:10:04.417
mk_1789459804420_goqko6	exam_1789459804296_n6ncui	es_n6ncui_0ihg	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	94.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.42	2026-09-15 08:10:04.42
mk_1789459804424_ym96ep	exam_1789459804296_n6ncui	es_n6ncui_0ihg	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	64.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.424	2026-09-15 08:10:04.424
mk_1789459804428_b7h8u2	exam_1789459804296_n6ncui	es_n6ncui_0ihg	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	98.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.428	2026-09-15 08:10:04.428
mk_1789459804431_bqu5pe	exam_1789459804296_n6ncui	es_n6ncui_0ihg	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	68.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.431	2026-09-15 08:10:04.431
mk_1789459804434_6ukvxs	exam_1789459804296_n6ncui	es_n6ncui_0ihg	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	95.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.434	2026-09-15 08:10:04.434
mk_1789459804438_a6or56	exam_1789459804296_n6ncui	es_n6ncui_0ihg	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	90.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.438	2026-09-15 08:10:04.438
mk_1789459804441_9bpbuz	exam_1789459804296_n6ncui	es_n6ncui_0ihg	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	92.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.441	2026-09-15 08:10:04.441
mk_1789459804445_wh3ijn	exam_1789459804296_n6ncui	es_n6ncui_0ihg	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	82.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.445	2026-09-15 08:10:04.445
mk_1789459804448_frlheh	exam_1789459804296_n6ncui	es_n6ncui_2dw2	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	67.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.448	2026-09-15 08:10:04.448
mk_1789459804451_vzoqrp	exam_1789459804296_n6ncui	es_n6ncui_2dw2	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	61.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.451	2026-09-15 08:10:04.451
mk_1789459804455_ycy4lk	exam_1789459804296_n6ncui	es_n6ncui_2dw2	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	80.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.455	2026-09-15 08:10:04.455
mk_1789459804458_7msxbu	exam_1789459804296_n6ncui	es_n6ncui_2dw2	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	69.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.458	2026-09-15 08:10:04.458
mk_1789459804462_0nh2dv	exam_1789459804296_n6ncui	es_n6ncui_2dw2	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	77.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.462	2026-09-15 08:10:04.462
mk_1789459804465_lfcpub	exam_1789459804296_n6ncui	es_n6ncui_2dw2	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	68.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.465	2026-09-15 08:10:04.465
mk_1789459804470_4fih6w	exam_1789459804296_n6ncui	es_n6ncui_2dw2	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	85.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.47	2026-09-15 08:10:04.47
mk_1789459804475_zdmune	exam_1789459804296_n6ncui	es_n6ncui_2dw2	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	72.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.475	2026-09-15 08:10:04.475
mk_1789459804479_x2e15i	exam_1789459804296_n6ncui	es_n6ncui_2dw2	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	87.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.479	2026-09-15 08:10:04.479
mk_1789459804483_hqyh62	exam_1789459804296_n6ncui	es_n6ncui_2dw2	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	79.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.483	2026-09-15 08:10:04.483
mk_1789459804487_sy2inl	exam_1789459804296_n6ncui	es_n6ncui_1gx2	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	84.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.487	2026-09-15 08:10:04.487
mk_1789459804491_fk5fvf	exam_1789459804296_n6ncui	es_n6ncui_1gx2	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	91.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.491	2026-09-15 08:10:04.491
mk_1789459804494_i4s9zr	exam_1789459804296_n6ncui	es_n6ncui_1gx2	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	62.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.494	2026-09-15 08:10:04.494
mk_1789459804498_qi2sck	exam_1789459804296_n6ncui	es_n6ncui_1gx2	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	80.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.498	2026-09-15 08:10:04.498
mk_1789459804502_ekde5c	exam_1789459804296_n6ncui	es_n6ncui_1gx2	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	82.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.502	2026-09-15 08:10:04.502
mk_1789459804506_qhji2f	exam_1789459804296_n6ncui	es_n6ncui_1gx2	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	95.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.506	2026-09-15 08:10:04.506
mk_1789459804510_jb1klb	exam_1789459804296_n6ncui	es_n6ncui_1gx2	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	63.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.51	2026-09-15 08:10:04.51
mk_1789459804513_sxzkn2	exam_1789459804296_n6ncui	es_n6ncui_1gx2	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	96.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.513	2026-09-15 08:10:04.513
mk_1789459804518_4wt7v1	exam_1789459804296_n6ncui	es_n6ncui_1gx2	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	95.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.518	2026-09-15 08:10:04.518
mk_1789459804522_jerail	exam_1789459804296_n6ncui	es_n6ncui_1gx2	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	67.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.522	2026-09-15 08:10:04.522
mk_1789459804526_ku3j9m	exam_1789459804296_n6ncui	es_n6ncui_sows	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	69.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.526	2026-09-15 08:10:04.526
mk_1789459804529_l10hus	exam_1789459804296_n6ncui	es_n6ncui_sows	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	81.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.529	2026-09-15 08:10:04.529
mk_1789459804533_zsb4l0	exam_1789459804296_n6ncui	es_n6ncui_sows	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	71.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.533	2026-09-15 08:10:04.533
mk_1789459804537_9d8ltw	exam_1789459804296_n6ncui	es_n6ncui_sows	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	93.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.537	2026-09-15 08:10:04.537
mk_1789459804541_h8dwsc	exam_1789459804296_n6ncui	es_n6ncui_sows	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	98.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.541	2026-09-15 08:10:04.541
mk_1789459804544_a7e65t	exam_1789459804296_n6ncui	es_n6ncui_sows	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	84.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.544	2026-09-15 08:10:04.544
mk_1789459804548_ps5wuc	exam_1789459804296_n6ncui	es_n6ncui_sows	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	76.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.548	2026-09-15 08:10:04.548
mk_1789459804552_kh5zy0	exam_1789459804296_n6ncui	es_n6ncui_sows	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	67.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.552	2026-09-15 08:10:04.552
mk_1789459804555_u0zpix	exam_1789459804296_n6ncui	es_n6ncui_sows	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	72.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.555	2026-09-15 08:10:04.555
mk_1789459804559_vbrkw7	exam_1789459804296_n6ncui	es_n6ncui_sows	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	60.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.559	2026-09-15 08:10:04.559
mk_1789459804562_uwpjb6	exam_1789459804296_n6ncui	es_n6ncui_uznz	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	66.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.562	2026-09-15 08:10:04.562
mk_1789459804566_jakac9	exam_1789459804296_n6ncui	es_n6ncui_uznz	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	67.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.566	2026-09-15 08:10:04.566
mk_1789459804569_2wqpm2	exam_1789459804296_n6ncui	es_n6ncui_uznz	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	63.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.569	2026-09-15 08:10:04.569
mk_1789459804572_b8r73l	exam_1789459804296_n6ncui	es_n6ncui_uznz	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	62.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.572	2026-09-15 08:10:04.572
mk_1789459804575_9v54c7	exam_1789459804296_n6ncui	es_n6ncui_uznz	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	64.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.575	2026-09-15 08:10:04.575
mk_1789459804580_rik90c	exam_1789459804296_n6ncui	es_n6ncui_uznz	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	80.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.58	2026-09-15 08:10:04.58
mk_1789459804584_93gzhp	exam_1789459804296_n6ncui	es_n6ncui_uznz	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	83.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.584	2026-09-15 08:10:04.584
mk_1789459804587_e9ywo1	exam_1789459804296_n6ncui	es_n6ncui_uznz	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	92.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.587	2026-09-15 08:10:04.587
mk_1789459804590_51f0lz	exam_1789459804296_n6ncui	es_n6ncui_uznz	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	75.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.59	2026-09-15 08:10:04.59
mk_1789459804593_sxcvuh	exam_1789459804296_n6ncui	es_n6ncui_uznz	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	89.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.593	2026-09-15 08:10:04.593
mk_1789459804597_3wk6rs	exam_1789459804308_oj63yl	es_oj63yl_0ihg	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	74.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.597	2026-09-15 08:10:04.597
mk_1789459804600_rag881	exam_1789459804308_oj63yl	es_oj63yl_0ihg	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	75.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.6	2026-09-15 08:10:04.6
mk_1789459804604_c9619k	exam_1789459804308_oj63yl	es_oj63yl_0ihg	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	76.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.604	2026-09-15 08:10:04.604
mk_1789459804607_u850uv	exam_1789459804308_oj63yl	es_oj63yl_0ihg	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	98.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.607	2026-09-15 08:10:04.607
mk_1789459804610_m1oujy	exam_1789459804308_oj63yl	es_oj63yl_0ihg	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	87.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.61	2026-09-15 08:10:04.61
mk_1789459804614_8lxqcl	exam_1789459804308_oj63yl	es_oj63yl_0ihg	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	66.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.614	2026-09-15 08:10:04.614
mk_1789459804617_zywivq	exam_1789459804308_oj63yl	es_oj63yl_0ihg	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	86.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.617	2026-09-15 08:10:04.617
mk_1789459804621_dmsktj	exam_1789459804308_oj63yl	es_oj63yl_0ihg	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	82.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.621	2026-09-15 08:10:04.621
mk_1789459804625_p18u4a	exam_1789459804308_oj63yl	es_oj63yl_0ihg	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	75.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.625	2026-09-15 08:10:04.625
mk_1789459804629_7gjwe5	exam_1789459804308_oj63yl	es_oj63yl_0ihg	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	87.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.629	2026-09-15 08:10:04.629
mk_1789459804632_cnsl3u	exam_1789459804308_oj63yl	es_oj63yl_2dw2	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	65.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.632	2026-09-15 08:10:04.632
mk_1789459804636_r6dx56	exam_1789459804308_oj63yl	es_oj63yl_2dw2	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	82.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.636	2026-09-15 08:10:04.636
mk_1789459804639_w8twb0	exam_1789459804308_oj63yl	es_oj63yl_2dw2	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	71.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.639	2026-09-15 08:10:04.639
mk_1789459804643_832y4k	exam_1789459804308_oj63yl	es_oj63yl_2dw2	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	95.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.643	2026-09-15 08:10:04.643
mk_1789459804646_b6q20k	exam_1789459804308_oj63yl	es_oj63yl_2dw2	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	90.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.646	2026-09-15 08:10:04.646
mk_1789459804649_npjy9c	exam_1789459804308_oj63yl	es_oj63yl_2dw2	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	64.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.649	2026-09-15 08:10:04.649
mk_1789459804652_kql0er	exam_1789459804308_oj63yl	es_oj63yl_2dw2	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	87.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.652	2026-09-15 08:10:04.652
mk_1789459804656_mzm7s0	exam_1789459804308_oj63yl	es_oj63yl_2dw2	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	62.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.656	2026-09-15 08:10:04.656
mk_1789459804659_qew4g8	exam_1789459804308_oj63yl	es_oj63yl_2dw2	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	84.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.659	2026-09-15 08:10:04.659
mk_1789459804662_dyd29o	exam_1789459804308_oj63yl	es_oj63yl_2dw2	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	63.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.662	2026-09-15 08:10:04.662
mk_1789459804665_08tk8z	exam_1789459804308_oj63yl	es_oj63yl_1gx2	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	85.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.665	2026-09-15 08:10:04.665
mk_1789459804668_5k4vlc	exam_1789459804308_oj63yl	es_oj63yl_1gx2	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	63.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.668	2026-09-15 08:10:04.668
mk_1789459804671_u683h0	exam_1789459804308_oj63yl	es_oj63yl_1gx2	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	78.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.671	2026-09-15 08:10:04.671
mk_1789459804675_ad34r8	exam_1789459804308_oj63yl	es_oj63yl_1gx2	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	84.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.675	2026-09-15 08:10:04.675
mk_1789459804678_62vhp2	exam_1789459804308_oj63yl	es_oj63yl_1gx2	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	87.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.678	2026-09-15 08:10:04.678
mk_1789459804681_nhjixi	exam_1789459804308_oj63yl	es_oj63yl_1gx2	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	77.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.681	2026-09-15 08:10:04.681
mk_1789459804684_gc32uz	exam_1789459804308_oj63yl	es_oj63yl_1gx2	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	95.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.684	2026-09-15 08:10:04.684
mk_1789459804687_hi2lvg	exam_1789459804308_oj63yl	es_oj63yl_1gx2	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	78.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.687	2026-09-15 08:10:04.687
mk_1789459804693_cf4pzu	exam_1789459804308_oj63yl	es_oj63yl_1gx2	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	66.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.693	2026-09-15 08:10:04.693
mk_1789459804696_w0i6nh	exam_1789459804308_oj63yl	es_oj63yl_1gx2	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	88.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.696	2026-09-15 08:10:04.696
mk_1789459804700_swfowt	exam_1789459804308_oj63yl	es_oj63yl_sows	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	71.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.7	2026-09-15 08:10:04.7
mk_1789459804702_t9lz26	exam_1789459804308_oj63yl	es_oj63yl_sows	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	91.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.702	2026-09-15 08:10:04.702
mk_1789459804706_og0scl	exam_1789459804308_oj63yl	es_oj63yl_sows	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	80.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.706	2026-09-15 08:10:04.706
mk_1789459804709_z9dxg9	exam_1789459804308_oj63yl	es_oj63yl_sows	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	83.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.709	2026-09-15 08:10:04.709
mk_1789459804713_lhzha4	exam_1789459804308_oj63yl	es_oj63yl_sows	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	99.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.713	2026-09-15 08:10:04.713
mk_1789459804716_g131xw	exam_1789459804308_oj63yl	es_oj63yl_sows	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	96.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.716	2026-09-15 08:10:04.716
mk_1789459804719_sjbv7u	exam_1789459804308_oj63yl	es_oj63yl_sows	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	62.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.719	2026-09-15 08:10:04.719
mk_1789459804722_95yfrx	exam_1789459804308_oj63yl	es_oj63yl_sows	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	94.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.722	2026-09-15 08:10:04.722
mk_1789459804725_m2rb3u	exam_1789459804308_oj63yl	es_oj63yl_sows	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	67.00	B		usr_1788405167553_kdqona	2026-09-15 08:10:04.725	2026-09-15 08:10:04.725
mk_1789459804728_exm3z2	exam_1789459804308_oj63yl	es_oj63yl_sows	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	72.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.728	2026-09-15 08:10:04.728
mk_1789459804731_xzku4v	exam_1789459804308_oj63yl	es_oj63yl_uznz	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	75.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.731	2026-09-15 08:10:04.731
mk_1789459804734_krrkoh	exam_1789459804308_oj63yl	es_oj63yl_uznz	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	74.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.734	2026-09-15 08:10:04.734
mk_1789459804738_pjn0s8	exam_1789459804308_oj63yl	es_oj63yl_uznz	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	89.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.738	2026-09-15 08:10:04.738
mk_1789459804741_lemyjd	exam_1789459804308_oj63yl	es_oj63yl_uznz	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	72.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.741	2026-09-15 08:10:04.741
mk_1789459804744_tmajsz	exam_1789459804308_oj63yl	es_oj63yl_uznz	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	83.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.744	2026-09-15 08:10:04.744
mk_1789459804748_kpvm2o	exam_1789459804308_oj63yl	es_oj63yl_uznz	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	70.00	B+		usr_1788405167553_kdqona	2026-09-15 08:10:04.748	2026-09-15 08:10:04.748
mk_1789459804751_3rv2oy	exam_1789459804308_oj63yl	es_oj63yl_uznz	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	98.00	A+		usr_1788405167553_kdqona	2026-09-15 08:10:04.751	2026-09-15 08:10:04.751
mk_1789459804753_l5ui7u	exam_1789459804308_oj63yl	es_oj63yl_uznz	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	81.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.753	2026-09-15 08:10:04.754
mk_1789459804757_ocl4og	exam_1789459804308_oj63yl	es_oj63yl_uznz	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	81.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.757	2026-09-15 08:10:04.757
mk_1789459804760_lm4mqa	exam_1789459804308_oj63yl	es_oj63yl_uznz	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	85.00	A		usr_1788405167553_kdqona	2026-09-15 08:10:04.76	2026-09-15 08:10:04.76
\.


--
-- Data for Name: periods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.periods (id, institution_code, label, start_time, end_time, sort_order, created_at, updated_at) FROM stdin;
per_1788385835712_vz3hgl	TST001	Period 1	09:00	10:00	0	2026-09-03 03:20:35.725135	2026-09-03 03:20:35.725135
per_1788385835714_yi6zni	TST001	Period 2	10:00	11:00	1	2026-09-03 03:20:35.726935	2026-09-03 03:20:35.726935
per_1788385835715_8gwewx	TST001	Period 3	11:00	12:00	2	2026-09-03 03:20:35.728231	2026-09-03 03:20:35.728231
per_1788385835717_cc9jio	TST001	Period 4	12:00	13:00	3	2026-09-03 03:20:35.729461	2026-09-03 03:20:35.729461
per_1788385835718_vh92g3	TST001	Lunch	13:00	14:00	4	2026-09-03 03:20:35.730735	2026-09-03 03:20:35.730735
per_1788385835719_gi7byn	TST001	Period 5	14:00	15:00	5	2026-09-03 03:20:35.731977	2026-09-03 03:20:35.731977
per_1788385835720_rirvxb	TST001	Period 6	15:00	16:00	6	2026-09-03 03:20:35.733164	2026-09-03 03:20:35.733164
\.


--
-- Data for Name: student_classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_classes (id, institution_code, student_id, class_section_id, roll_no, academic_year, effective_from, effective_to, is_active, created_at, updated_at) FROM stdin;
sc_1788405514483_q8xf0g	TST001	usr_1788405363182_d7rnj8	cs_1788379055324_gux95b	C6A-002	A	2024-01-01	\N	t	2026-09-03 08:48:34.485051	2026-09-03 08:48:34.485051
sc_1788405514511_8fulvn	TST001	usr_1788405363217_tj8o9z	cs_1788379055324_gux95b	C6A-003	A	2024-01-01	\N	t	2026-09-03 08:48:34.51332	2026-09-03 08:48:34.51332
sc_1788405514514_d42rf3	TST001	usr_1788405363220_sok6dj	cs_1788379055324_gux95b	C6A-004	A	2024-01-01	\N	t	2026-09-03 08:48:34.516162	2026-09-03 08:48:34.516162
sc_1788405514517_07ru1d	TST001	usr_1788405363222_lhyvtz	cs_1788379055324_gux95b	C6A-005	A	2024-01-01	\N	t	2026-09-03 08:48:34.518828	2026-09-03 08:48:34.518828
sc_1788405514520_6g8xz0	TST001	usr_1788361696558_4x5g	cs_1788379055324_gux95b	C6A-001	A	2024-01-01	\N	t	2026-09-03 08:48:34.521621	2026-09-03 08:48:34.521621
sc_1788405514522_4f3d6w	TST001	usr_1788405363224_3e7k3h	cs_1788379055324_gux95b	C6A-006	A	2024-01-01	\N	t	2026-09-03 08:48:34.52419	2026-09-03 08:48:34.52419
sc_1788405514525_ucmw46	TST001	usr_1788405363227_24ccwl	cs_1788379055324_gux95b	C6A-007	A	2024-01-01	\N	t	2026-09-03 08:48:34.526902	2026-09-03 08:48:34.526902
sc_1788405514529_grw3h4	TST001	usr_1788405363229_c4a1z0	cs_1788379055324_gux95b	C6A-008	A	2024-01-01	\N	t	2026-09-03 08:48:34.530547	2026-09-03 08:48:34.530547
sc_1788405514531_7sfa0t	TST001	usr_1788405363231_ubswfh	cs_1788379055324_gux95b	C6A-009	A	2024-01-01	\N	t	2026-09-03 08:48:34.53303	2026-09-03 08:48:34.53303
sc_1788405514534_5x2d4k	TST001	usr_1788405363233_jmtosk	cs_1788379055324_gux95b	C6A-010	A	2024-01-01	\N	t	2026-09-03 08:48:34.535504	2026-09-03 08:48:34.535504
\.


--
-- Data for Name: student_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_documents (id, institution_code, student_id, document_type, file_name, file_url, created_at) FROM stdin;
\.


--
-- Data for Name: subject_teachers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subject_teachers (id, institution_code, class_section_id, subject_id, teacher_id, created_at, updated_at) FROM stdin;
st_1788384200414_buyvhb	TST001	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-03 02:53:20.417646	2026-09-03 02:53:20.417646
st_1787131796064_j8z5nfa	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_2zi0ihg	usr_1788405167559_qug6ew	2026-08-19 14:59:56.21124	2026-09-03 08:42:47.574887
st_1787131796064_vpotc7b	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	2026-08-19 14:59:56.208259	2026-09-03 08:42:47.578308
st_1787131796064_qac5uo8	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	2026-08-19 14:59:56.209507	2026-09-03 08:42:47.581249
st_1787131796064_qbjatd3	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_u1quznz	usr_1788405167556_jrwyaj	2026-08-19 14:59:56.210378	2026-09-03 08:42:47.583475
st_1788405271205_1ets4n	TST001	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	2026-09-03 08:44:31.211191	2026-09-03 08:44:31.211191
st_1788405271272_k8lsd9	TST001	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	2026-09-03 08:44:31.278264	2026-09-03 08:44:31.278264
st_1788405271274_9n90jb	TST001	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	usr_1788405167556_jrwyaj	2026-09-03 08:44:31.2805	2026-09-03 08:44:31.2805
st_1788405271277_sw0f7w	TST001	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	usr_1788405167559_qug6ew	2026-09-03 08:44:31.282938	2026-09-03 08:44:31.282938
st_1788671115928_mykun9	TST001	cs_1788379813902_pft59u	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-06 10:35:16.19401	2026-09-06 10:35:16.19401
st_1788671116204_julul7	TST001	cs_1788379813902_zzyr9e	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-06 10:35:16.205633	2026-09-06 10:35:16.205633
st_1788671116207_pun5sa	TST001	cs_1788379813902_7kz6cp	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-06 10:35:16.208786	2026-09-06 10:35:16.208786
st_1788671116210_ivh85s	TST001	cs_1788379813902_2dewmf	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-06 10:35:16.211742	2026-09-06 10:35:16.211742
st_1788671116214_v20omi	TST001	cs_1788379813902_r5wr0l	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-06 10:35:16.215323	2026-09-06 10:35:16.215323
st_1788671116217_s1ldoa	TST001	cs_1788379813902_pev05o	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-06 10:35:16.218982	2026-09-06 10:35:16.218982
st_1788671116220_xvn8rv	TST001	cs_1788379813902_lhp6q2	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-06 10:35:16.221827	2026-09-06 10:35:16.221827
st_1788671116223_azj3gb	TST001	cs_1788379813902_pwotnk	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-06 10:35:16.224263	2026-09-06 10:35:16.224263
st_1788671116225_6ukpqj	TST001	cs_1788379813902_ewt5n5	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-06 10:35:16.227043	2026-09-06 10:35:16.227043
st_1788671116228_icllm5	TST001	cs_1788379813902_zk0e5a	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-06 10:35:16.22965	2026-09-06 10:35:16.22965
st_1788671116230_8vn2qm	TST001	cs_1788379813902_qtd5xm	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-06 10:35:16.231697	2026-09-06 10:35:16.231697
st_1788671116233_27qbvv	TST001	cs_1788379813902_nc4cnr	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	2026-09-06 10:35:16.234115	2026-09-06 10:35:16.234115
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subjects (id, institution_code, name, code, created_at, updated_at) FROM stdin;
sub_1787131796064_a9u1gx2	TST001	Mathematics	MTH	2026-08-19 14:59:56.195733	2026-08-19 14:59:56.195733
sub_1787131796064_68d2dw2	TST001	English	ENG	2026-08-19 14:59:56.198316	2026-08-19 14:59:56.198316
sub_1787131796064_4t8sows	TST001	Science	SCI	2026-08-19 14:59:56.199302	2026-08-19 14:59:56.199302
sub_1787131796064_u1quznz	TST001	Social Studies	SST	2026-08-19 14:59:56.201562	2026-08-19 14:59:56.201562
sub_1787131796064_2zi0ihg	TST001	Computer Science	CSC	2026-08-19 14:59:56.202585	2026-08-19 14:59:56.202585
\.


--
-- Data for Name: timetable_slots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.timetable_slots (id, timetable_id, institution_code, class_section_id, subject_id, teacher_id, period_id, day_of_week, room, created_at, updated_at) FROM stdin;
ts_8tv21n_1_0	tt_1789459804200_8tv21n	TST001	cs_1788379813902_nc4cnr	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	1	Class10C-1	2026-09-15 08:10:04.2	2026-09-15 08:10:04.2
ts_8tv21n_2_0	tt_1789459804200_8tv21n	TST001	cs_1788379813902_nc4cnr	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	2	Class10C-1	2026-09-15 08:10:04.2	2026-09-15 08:10:04.2
ts_8tv21n_3_0	tt_1789459804200_8tv21n	TST001	cs_1788379813902_nc4cnr	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	3	Class10C-1	2026-09-15 08:10:04.2	2026-09-15 08:10:04.2
ts_8tv21n_4_0	tt_1789459804200_8tv21n	TST001	cs_1788379813902_nc4cnr	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	4	Class10C-1	2026-09-15 08:10:04.2	2026-09-15 08:10:04.2
ts_8tv21n_5_0	tt_1789459804200_8tv21n	TST001	cs_1788379813902_nc4cnr	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	5	Class10C-1	2026-09-15 08:10:04.2	2026-09-15 08:10:04.2
ts_nb8eoj_1_0	tt_1789459804219_nb8eoj	TST001	cs_1788379813902_pft59u	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	1	Class5B-1	2026-09-15 08:10:04.219	2026-09-15 08:10:04.219
ts_nb8eoj_2_0	tt_1789459804219_nb8eoj	TST001	cs_1788379813902_pft59u	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	2	Class5B-1	2026-09-15 08:10:04.219	2026-09-15 08:10:04.219
ts_nb8eoj_3_0	tt_1789459804219_nb8eoj	TST001	cs_1788379813902_pft59u	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	3	Class5B-1	2026-09-15 08:10:04.219	2026-09-15 08:10:04.219
ts_nb8eoj_4_0	tt_1789459804219_nb8eoj	TST001	cs_1788379813902_pft59u	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	4	Class5B-1	2026-09-15 08:10:04.219	2026-09-15 08:10:04.219
ts_nb8eoj_5_0	tt_1789459804219_nb8eoj	TST001	cs_1788379813902_pft59u	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	5	Class5B-1	2026-09-15 08:10:04.219	2026-09-15 08:10:04.219
ts_78v2fx_1_0	tt_1789459804226_78v2fx	TST001	cs_1788379813902_zzyr9e	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	1	Class6B-1	2026-09-15 08:10:04.226	2026-09-15 08:10:04.226
ts_78v2fx_2_0	tt_1789459804226_78v2fx	TST001	cs_1788379813902_zzyr9e	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	2	Class6B-1	2026-09-15 08:10:04.226	2026-09-15 08:10:04.226
ts_78v2fx_3_0	tt_1789459804226_78v2fx	TST001	cs_1788379813902_zzyr9e	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	3	Class6B-1	2026-09-15 08:10:04.226	2026-09-15 08:10:04.226
ts_78v2fx_4_0	tt_1789459804226_78v2fx	TST001	cs_1788379813902_zzyr9e	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	4	Class6B-1	2026-09-15 08:10:04.226	2026-09-15 08:10:04.226
ts_78v2fx_5_0	tt_1789459804226_78v2fx	TST001	cs_1788379813902_zzyr9e	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	5	Class6B-1	2026-09-15 08:10:04.226	2026-09-15 08:10:04.226
ts_pj6p10_1_0	tt_1789459804233_pj6p10	TST001	cs_1788379813902_7kz6cp	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	1	Class6C-1	2026-09-15 08:10:04.233	2026-09-15 08:10:04.233
ts_pj6p10_2_0	tt_1789459804233_pj6p10	TST001	cs_1788379813902_7kz6cp	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	2	Class6C-1	2026-09-15 08:10:04.233	2026-09-15 08:10:04.233
ts_pj6p10_3_0	tt_1789459804233_pj6p10	TST001	cs_1788379813902_7kz6cp	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	3	Class6C-1	2026-09-15 08:10:04.233	2026-09-15 08:10:04.233
ts_pj6p10_4_0	tt_1789459804233_pj6p10	TST001	cs_1788379813902_7kz6cp	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	4	Class6C-1	2026-09-15 08:10:04.233	2026-09-15 08:10:04.233
ts_pj6p10_5_0	tt_1789459804233_pj6p10	TST001	cs_1788379813902_7kz6cp	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	5	Class6C-1	2026-09-15 08:10:04.233	2026-09-15 08:10:04.233
ts_2oqjiq_1_0	tt_1789459804239_2oqjiq	TST001	cs_1788379813902_2dewmf	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	1	Class7A-1	2026-09-15 08:10:04.239	2026-09-15 08:10:04.239
ts_2oqjiq_2_0	tt_1789459804239_2oqjiq	TST001	cs_1788379813902_2dewmf	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	2	Class7A-1	2026-09-15 08:10:04.239	2026-09-15 08:10:04.239
ts_2oqjiq_3_0	tt_1789459804239_2oqjiq	TST001	cs_1788379813902_2dewmf	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	3	Class7A-1	2026-09-15 08:10:04.239	2026-09-15 08:10:04.239
ts_2oqjiq_4_0	tt_1789459804239_2oqjiq	TST001	cs_1788379813902_2dewmf	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	4	Class7A-1	2026-09-15 08:10:04.239	2026-09-15 08:10:04.239
ts_2oqjiq_5_0	tt_1789459804239_2oqjiq	TST001	cs_1788379813902_2dewmf	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	5	Class7A-1	2026-09-15 08:10:04.239	2026-09-15 08:10:04.239
ts_otnnwg_1_0	tt_1789459804247_otnnwg	TST001	cs_1788379813902_r5wr0l	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	1	Class7B-1	2026-09-15 08:10:04.247	2026-09-15 08:10:04.247
ts_otnnwg_2_0	tt_1789459804247_otnnwg	TST001	cs_1788379813902_r5wr0l	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	2	Class7B-1	2026-09-15 08:10:04.247	2026-09-15 08:10:04.247
ts_otnnwg_3_0	tt_1789459804247_otnnwg	TST001	cs_1788379813902_r5wr0l	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	3	Class7B-1	2026-09-15 08:10:04.247	2026-09-15 08:10:04.247
ts_otnnwg_4_0	tt_1789459804247_otnnwg	TST001	cs_1788379813902_r5wr0l	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	4	Class7B-1	2026-09-15 08:10:04.247	2026-09-15 08:10:04.247
ts_otnnwg_5_0	tt_1789459804247_otnnwg	TST001	cs_1788379813902_r5wr0l	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	5	Class7B-1	2026-09-15 08:10:04.247	2026-09-15 08:10:04.247
ts_ru3bgs_1_0	tt_1789459804254_ru3bgs	TST001	cs_1788379813902_pev05o	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	1	Class7C-1	2026-09-15 08:10:04.254	2026-09-15 08:10:04.254
ts_ru3bgs_2_0	tt_1789459804254_ru3bgs	TST001	cs_1788379813902_pev05o	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	2	Class7C-1	2026-09-15 08:10:04.254	2026-09-15 08:10:04.254
ts_ru3bgs_3_0	tt_1789459804254_ru3bgs	TST001	cs_1788379813902_pev05o	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	3	Class7C-1	2026-09-15 08:10:04.254	2026-09-15 08:10:04.254
ts_ru3bgs_4_0	tt_1789459804254_ru3bgs	TST001	cs_1788379813902_pev05o	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	4	Class7C-1	2026-09-15 08:10:04.254	2026-09-15 08:10:04.254
ts_ru3bgs_5_0	tt_1789459804254_ru3bgs	TST001	cs_1788379813902_pev05o	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	5	Class7C-1	2026-09-15 08:10:04.254	2026-09-15 08:10:04.254
ts_6zitif_1_0	tt_1789459804263_6zitif	TST001	cs_1788379813902_lhp6q2	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	1	Class8A-1	2026-09-15 08:10:04.263	2026-09-15 08:10:04.263
ts_6zitif_2_0	tt_1789459804263_6zitif	TST001	cs_1788379813902_lhp6q2	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	2	Class8A-1	2026-09-15 08:10:04.263	2026-09-15 08:10:04.263
ts_6zitif_3_0	tt_1789459804263_6zitif	TST001	cs_1788379813902_lhp6q2	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	3	Class8A-1	2026-09-15 08:10:04.263	2026-09-15 08:10:04.263
ts_6zitif_4_0	tt_1789459804263_6zitif	TST001	cs_1788379813902_lhp6q2	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	4	Class8A-1	2026-09-15 08:10:04.263	2026-09-15 08:10:04.263
ts_6zitif_5_0	tt_1789459804263_6zitif	TST001	cs_1788379813902_lhp6q2	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	5	Class8A-1	2026-09-15 08:10:04.263	2026-09-15 08:10:04.263
ts_uktcbt_1_0	tt_1789459804268_uktcbt	TST001	cs_1788379813902_pwotnk	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	1	Class8B-1	2026-09-15 08:10:04.268	2026-09-15 08:10:04.268
ts_uktcbt_2_0	tt_1789459804268_uktcbt	TST001	cs_1788379813902_pwotnk	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	2	Class8B-1	2026-09-15 08:10:04.268	2026-09-15 08:10:04.268
ts_uktcbt_3_0	tt_1789459804268_uktcbt	TST001	cs_1788379813902_pwotnk	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	3	Class8B-1	2026-09-15 08:10:04.268	2026-09-15 08:10:04.268
ts_uktcbt_4_0	tt_1789459804268_uktcbt	TST001	cs_1788379813902_pwotnk	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	4	Class8B-1	2026-09-15 08:10:04.268	2026-09-15 08:10:04.268
ts_uktcbt_5_0	tt_1789459804268_uktcbt	TST001	cs_1788379813902_pwotnk	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	5	Class8B-1	2026-09-15 08:10:04.268	2026-09-15 08:10:04.268
ts_146qxh_1_0	tt_1789459804273_146qxh	TST001	cs_1788379813902_ewt5n5	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	1	Class9A-1	2026-09-15 08:10:04.273	2026-09-15 08:10:04.273
ts_146qxh_2_0	tt_1789459804273_146qxh	TST001	cs_1788379813902_ewt5n5	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	2	Class9A-1	2026-09-15 08:10:04.273	2026-09-15 08:10:04.273
ts_146qxh_3_0	tt_1789459804273_146qxh	TST001	cs_1788379813902_ewt5n5	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	3	Class9A-1	2026-09-15 08:10:04.273	2026-09-15 08:10:04.273
ts_146qxh_4_0	tt_1789459804273_146qxh	TST001	cs_1788379813902_ewt5n5	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	4	Class9A-1	2026-09-15 08:10:04.273	2026-09-15 08:10:04.273
ts_146qxh_5_0	tt_1789459804273_146qxh	TST001	cs_1788379813902_ewt5n5	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	5	Class9A-1	2026-09-15 08:10:04.273	2026-09-15 08:10:04.273
ts_ox40mc_1_0	tt_1789459804280_ox40mc	TST001	cs_1788379813902_zk0e5a	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	1	Class9B-1	2026-09-15 08:10:04.28	2026-09-15 08:10:04.28
ts_ox40mc_2_0	tt_1789459804280_ox40mc	TST001	cs_1788379813902_zk0e5a	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	2	Class9B-1	2026-09-15 08:10:04.28	2026-09-15 08:10:04.28
ts_ox40mc_3_0	tt_1789459804280_ox40mc	TST001	cs_1788379813902_zk0e5a	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	3	Class9B-1	2026-09-15 08:10:04.28	2026-09-15 08:10:04.28
ts_ox40mc_4_0	tt_1789459804280_ox40mc	TST001	cs_1788379813902_zk0e5a	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	4	Class9B-1	2026-09-15 08:10:04.28	2026-09-15 08:10:04.28
ts_ox40mc_5_0	tt_1789459804280_ox40mc	TST001	cs_1788379813902_zk0e5a	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	5	Class9B-1	2026-09-15 08:10:04.28	2026-09-15 08:10:04.28
ts_0eqpot_1_0	tt_1789459804285_0eqpot	TST001	cs_1788379813902_qtd5xm	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	1	Class9C-1	2026-09-15 08:10:04.285	2026-09-15 08:10:04.285
ts_0eqpot_2_0	tt_1789459804285_0eqpot	TST001	cs_1788379813902_qtd5xm	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	2	Class9C-1	2026-09-15 08:10:04.285	2026-09-15 08:10:04.285
ts_0eqpot_3_0	tt_1789459804285_0eqpot	TST001	cs_1788379813902_qtd5xm	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	3	Class9C-1	2026-09-15 08:10:04.285	2026-09-15 08:10:04.285
ts_0eqpot_4_0	tt_1789459804285_0eqpot	TST001	cs_1788379813902_qtd5xm	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	4	Class9C-1	2026-09-15 08:10:04.285	2026-09-15 08:10:04.285
ts_0eqpot_5_0	tt_1789459804285_0eqpot	TST001	cs_1788379813902_qtd5xm	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835712_vz3hgl	5	Class9C-1	2026-09-15 08:10:04.285	2026-09-15 08:10:04.285
ts_1788405167589_rh60vr	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835712_vz3hgl	1	Room 100	2026-09-03 08:42:47.593502	2026-09-03 08:42:47.593502
ts_1788405167592_ndsw23	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	per_1788385835714_yi6zni	1	Room 101	2026-09-03 08:42:47.597091	2026-09-03 08:42:47.597091
ts_1788405167593_tjexke	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_u1quznz	usr_1788405167556_jrwyaj	per_1788385835715_8gwewx	1	Room 102	2026-09-03 08:42:47.598332	2026-09-03 08:42:47.598332
ts_1788405167595_l5msh6	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835717_cc9jio	1	Room 103	2026-09-03 08:42:47.599449	2026-09-03 08:42:47.599449
ts_1788405167596_lu9ia1	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_2zi0ihg	usr_1788405167559_qug6ew	per_1788385835719_gi7byn	1	Room 104	2026-09-03 08:42:47.600492	2026-09-03 08:42:47.600492
ts_1788405167598_ptyjhs	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835720_rirvxb	1	Room 105	2026-09-03 08:42:47.602925	2026-09-03 08:42:47.602925
ts_1788405167599_msgg73	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835712_vz3hgl	2	Room 100	2026-09-03 08:42:47.603993	2026-09-03 08:42:47.603993
ts_1788405167600_xs12hf	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	per_1788385835714_yi6zni	2	Room 101	2026-09-03 08:42:47.605108	2026-09-03 08:42:47.605108
ts_1788405167601_sve6mw	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_u1quznz	usr_1788405167556_jrwyaj	per_1788385835715_8gwewx	2	Room 102	2026-09-03 08:42:47.60617	2026-09-03 08:42:47.60617
ts_1788405167602_7swz13	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835717_cc9jio	2	Room 103	2026-09-03 08:42:47.607242	2026-09-03 08:42:47.607242
ts_1788405167603_8m4ohc	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_2zi0ihg	usr_1788405167559_qug6ew	per_1788385835719_gi7byn	2	Room 104	2026-09-03 08:42:47.608324	2026-09-03 08:42:47.608324
ts_1788405167605_2ptj7f	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835720_rirvxb	2	Room 105	2026-09-03 08:42:47.609502	2026-09-03 08:42:47.609502
ts_1788405167606_susaee	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835712_vz3hgl	3	Room 100	2026-09-03 08:42:47.610745	2026-09-03 08:42:47.610745
ts_1788405167607_ywjtkd	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	per_1788385835714_yi6zni	3	Room 101	2026-09-03 08:42:47.611726	2026-09-03 08:42:47.611726
ts_1788405167608_k9tn4r	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_u1quznz	usr_1788405167556_jrwyaj	per_1788385835715_8gwewx	3	Room 102	2026-09-03 08:42:47.612725	2026-09-03 08:42:47.612725
ts_1788405167609_8l8rp2	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835717_cc9jio	3	Room 103	2026-09-03 08:42:47.613766	2026-09-03 08:42:47.613766
ts_1788405167611_00k4ya	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_2zi0ihg	usr_1788405167559_qug6ew	per_1788385835719_gi7byn	3	Room 104	2026-09-03 08:42:47.615483	2026-09-03 08:42:47.615483
ts_1788405167612_c8iyta	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835720_rirvxb	3	Room 105	2026-09-03 08:42:47.616489	2026-09-03 08:42:47.616489
ts_1788405167613_5tcrbg	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835712_vz3hgl	4	Room 100	2026-09-03 08:42:47.61752	2026-09-03 08:42:47.61752
ts_1788405167614_5wc891	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	per_1788385835714_yi6zni	4	Room 101	2026-09-03 08:42:47.618527	2026-09-03 08:42:47.618527
ts_1788405167615_1s0rzp	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_u1quznz	usr_1788405167556_jrwyaj	per_1788385835715_8gwewx	4	Room 102	2026-09-03 08:42:47.619581	2026-09-03 08:42:47.619581
ts_1788405167616_75eoh8	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835717_cc9jio	4	Room 103	2026-09-03 08:42:47.620631	2026-09-03 08:42:47.620631
ts_1788405167617_5804mq	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_2zi0ihg	usr_1788405167559_qug6ew	per_1788385835719_gi7byn	4	Room 104	2026-09-03 08:42:47.621636	2026-09-03 08:42:47.621636
ts_1788405167618_yxr9ab	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835720_rirvxb	4	Room 105	2026-09-03 08:42:47.622761	2026-09-03 08:42:47.622761
ts_1788405167619_4ul8eh	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835712_vz3hgl	5	Room 100	2026-09-03 08:42:47.623884	2026-09-03 08:42:47.623884
ts_1788405167620_zvp350	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	per_1788385835714_yi6zni	5	Room 101	2026-09-03 08:42:47.624851	2026-09-03 08:42:47.624851
ts_1788405167621_1i69r8	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_u1quznz	usr_1788405167556_jrwyaj	per_1788385835715_8gwewx	5	Room 102	2026-09-03 08:42:47.625793	2026-09-03 08:42:47.625793
ts_1788405167622_qk7ylc	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835717_cc9jio	5	Room 103	2026-09-03 08:42:47.627046	2026-09-03 08:42:47.627046
ts_1788405167623_wxlmp5	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_2zi0ihg	usr_1788405167559_qug6ew	per_1788385835719_gi7byn	5	Room 104	2026-09-03 08:42:47.628091	2026-09-03 08:42:47.628091
ts_1788405167624_v6idpp	tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835720_rirvxb	5	Room 105	2026-09-03 08:42:47.629351	2026-09-03 08:42:47.629351
ts_1788405271284_wbtmoe	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835712_vz3hgl	1	Room 100	2026-09-03 08:44:31.290418	2026-09-03 08:44:31.290418
ts_1788405271286_eo693h	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	per_1788385835714_yi6zni	1	Room 101	2026-09-03 08:44:31.291777	2026-09-03 08:44:31.291777
ts_1788405271287_av3dmg	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	usr_1788405167556_jrwyaj	per_1788385835715_8gwewx	1	Room 102	2026-09-03 08:44:31.292671	2026-09-03 08:44:31.292671
ts_1788405271289_xiuznt	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835717_cc9jio	1	Room 103	2026-09-03 08:44:31.295428	2026-09-03 08:44:31.295428
ts_1788405271290_ksprgg	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	usr_1788405167559_qug6ew	per_1788385835719_gi7byn	1	Room 104	2026-09-03 08:44:31.296454	2026-09-03 08:44:31.296454
ts_1788405271292_rk26ve	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835720_rirvxb	1	Room 105	2026-09-03 08:44:31.29752	2026-09-03 08:44:31.29752
ts_1788405271293_gcpgrb	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835712_vz3hgl	2	Room 100	2026-09-03 08:44:31.298615	2026-09-03 08:44:31.298615
ts_1788405271294_pyakam	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	per_1788385835714_yi6zni	2	Room 101	2026-09-03 08:44:31.299652	2026-09-03 08:44:31.299652
ts_1788405271295_ghuke2	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	usr_1788405167556_jrwyaj	per_1788385835715_8gwewx	2	Room 102	2026-09-03 08:44:31.300831	2026-09-03 08:44:31.300831
ts_1788405271296_zxnqm8	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835717_cc9jio	2	Room 103	2026-09-03 08:44:31.30184	2026-09-03 08:44:31.30184
ts_1788405271297_xj29h5	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	usr_1788405167559_qug6ew	per_1788385835719_gi7byn	2	Room 104	2026-09-03 08:44:31.30299	2026-09-03 08:44:31.30299
ts_1788405271298_247d0i	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835720_rirvxb	2	Room 105	2026-09-03 08:44:31.303951	2026-09-03 08:44:31.303951
ts_1788405271299_fwh243	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835712_vz3hgl	3	Room 100	2026-09-03 08:44:31.304999	2026-09-03 08:44:31.304999
ts_1788405271300_juu2on	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	per_1788385835714_yi6zni	3	Room 101	2026-09-03 08:44:31.306204	2026-09-03 08:44:31.306204
ts_1788405271301_kibjpk	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	usr_1788405167556_jrwyaj	per_1788385835715_8gwewx	3	Room 102	2026-09-03 08:44:31.307395	2026-09-03 08:44:31.307395
ts_1788405271302_fzg088	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835717_cc9jio	3	Room 103	2026-09-03 08:44:31.308374	2026-09-03 08:44:31.308374
ts_1788405271303_748xxh	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	usr_1788405167559_qug6ew	per_1788385835719_gi7byn	3	Room 104	2026-09-03 08:44:31.309348	2026-09-03 08:44:31.309348
ts_1788405271304_56knln	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835720_rirvxb	3	Room 105	2026-09-03 08:44:31.310331	2026-09-03 08:44:31.310331
ts_1788405271305_q7mkgl	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835712_vz3hgl	4	Room 100	2026-09-03 08:44:31.311349	2026-09-03 08:44:31.311349
ts_1788405271306_3of1nu	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	per_1788385835714_yi6zni	4	Room 101	2026-09-03 08:44:31.312365	2026-09-03 08:44:31.312365
ts_1788405271307_cii4b2	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	usr_1788405167556_jrwyaj	per_1788385835715_8gwewx	4	Room 102	2026-09-03 08:44:31.313299	2026-09-03 08:44:31.313299
ts_1788405271308_7kjyoz	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835717_cc9jio	4	Room 103	2026-09-03 08:44:31.314217	2026-09-03 08:44:31.314217
ts_1788405271309_1qhv11	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	usr_1788405167559_qug6ew	per_1788385835719_gi7byn	4	Room 104	2026-09-03 08:44:31.315114	2026-09-03 08:44:31.315114
ts_1788405271310_iu33iw	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835720_rirvxb	4	Room 105	2026-09-03 08:44:31.316094	2026-09-03 08:44:31.316094
ts_1788405271311_jawqki	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835712_vz3hgl	5	Room 100	2026-09-03 08:44:31.3172	2026-09-03 08:44:31.3172
ts_1788405271312_3q03hr	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_4t8sows	usr_1788405167553_kdqona	per_1788385835714_yi6zni	5	Room 101	2026-09-03 08:44:31.318142	2026-09-03 08:44:31.318142
ts_1788405271314_5m2h3z	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_u1quznz	usr_1788405167556_jrwyaj	per_1788385835715_8gwewx	5	Room 102	2026-09-03 08:44:31.320361	2026-09-03 08:44:31.320361
ts_1788405271315_jb490j	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_a9u1gx2	usr_1787066287949_dsdty	per_1788385835717_cc9jio	5	Room 103	2026-09-03 08:44:31.321441	2026-09-03 08:44:31.321441
ts_1788405271316_lxwz2y	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_2zi0ihg	usr_1788405167559_qug6ew	per_1788385835719_gi7byn	5	Room 104	2026-09-03 08:44:31.322346	2026-09-03 08:44:31.322346
ts_1788405271317_hcv7ve	tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b	sub_1787131796064_68d2dw2	usr_1788405167547_a4rct7	per_1788385835720_rirvxb	5	Room 105	2026-09-03 08:44:31.323289	2026-09-03 08:44:31.323289
\.


--
-- Data for Name: timetables; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.timetables (id, institution_code, class_section_id, academic_year, term, version, effective_from, created_by, created_at, updated_at) FROM stdin;
tt_1787131796064_ui27q8d	TST001	cs_1787131796064_96rs2lu	A	Term 1	1	2026-08-19	usr_1787066287949_dsdty	2026-08-19 14:59:56.220177	2026-08-19 14:59:56.220177
tt_1788385835728_4onynt	TST001	cs_1788379055324_gux95b			1	2026-09-03	usr_1787066287949_dsdty	2026-09-03 03:20:35.741109	2026-09-03 03:20:35.741109
tt_1789459804200_8tv21n	TST001	cs_1788379813902_nc4cnr	2026-2027	Term 1	1	2026-09-15	usr_1788405167553_kdqona	2026-09-15 08:10:04.2	2026-09-15 08:10:04.2
tt_1789459804219_nb8eoj	TST001	cs_1788379813902_pft59u	2026-2027	Term 1	1	2026-09-15	usr_1788405167553_kdqona	2026-09-15 08:10:04.219	2026-09-15 08:10:04.219
tt_1789459804226_78v2fx	TST001	cs_1788379813902_zzyr9e	2026-2027	Term 1	1	2026-09-15	usr_1788405167553_kdqona	2026-09-15 08:10:04.226	2026-09-15 08:10:04.226
tt_1789459804233_pj6p10	TST001	cs_1788379813902_7kz6cp	2026-2027	Term 1	1	2026-09-15	usr_1788405167553_kdqona	2026-09-15 08:10:04.233	2026-09-15 08:10:04.233
tt_1789459804239_2oqjiq	TST001	cs_1788379813902_2dewmf	2026-2027	Term 1	1	2026-09-15	usr_1788405167553_kdqona	2026-09-15 08:10:04.239	2026-09-15 08:10:04.239
tt_1789459804247_otnnwg	TST001	cs_1788379813902_r5wr0l	2026-2027	Term 1	1	2026-09-15	usr_1788405167553_kdqona	2026-09-15 08:10:04.247	2026-09-15 08:10:04.247
tt_1789459804254_ru3bgs	TST001	cs_1788379813902_pev05o	2026-2027	Term 1	1	2026-09-15	usr_1788405167553_kdqona	2026-09-15 08:10:04.254	2026-09-15 08:10:04.254
tt_1789459804263_6zitif	TST001	cs_1788379813902_lhp6q2	2026-2027	Term 1	1	2026-09-15	usr_1788405167553_kdqona	2026-09-15 08:10:04.263	2026-09-15 08:10:04.263
tt_1789459804268_uktcbt	TST001	cs_1788379813902_pwotnk	2026-2027	Term 1	1	2026-09-15	usr_1788405167553_kdqona	2026-09-15 08:10:04.268	2026-09-15 08:10:04.268
tt_1789459804273_146qxh	TST001	cs_1788379813902_ewt5n5	2026-2027	Term 1	1	2026-09-15	usr_1788405167553_kdqona	2026-09-15 08:10:04.273	2026-09-15 08:10:04.273
tt_1789459804280_ox40mc	TST001	cs_1788379813902_zk0e5a	2026-2027	Term 1	1	2026-09-15	usr_1788405167553_kdqona	2026-09-15 08:10:04.28	2026-09-15 08:10:04.28
tt_1789459804285_0eqpot	TST001	cs_1788379813902_qtd5xm	2026-2027	Term 1	1	2026-09-15	usr_1788405167553_kdqona	2026-09-15 08:10:04.285	2026-09-15 08:10:04.285
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, firebase_uid, email, full_name, role, institution_code, institution_name, institution_type, roll_no_usn, must_change_password, profile_completed, parent_phone, student_phone, profile_pic_url, tenth_percentage, twelfth_percentage, title, scope, permissions, created_at, updated_at, graduated_at) FROM stdin;
usr_1788405167553_kdqona	firebase_usr_1788405167553_kdqona	vivek.teacher@schoolerp.test	Mr Vivek	teacher	TST001	Test School	school		t	f							{}	[]	2026-09-03 08:42:47.558254	2026-09-03 08:42:47.558254	\N
usr_1788405167556_jrwyaj	firebase_usr_1788405167556_jrwyaj	priya.teacher@schoolerp.test	Ms Priya	teacher	TST001	Test School	school		t	f							{}	[]	2026-09-03 08:42:47.560972	2026-09-03 08:42:47.560972	\N
usr_1788405167559_qug6ew	firebase_usr_1788405167559_qug6ew	rohan.teacher@schoolerp.test	Mr Rohan	teacher	TST001	Test School	school		t	f							{}	[]	2026-09-03 08:42:47.564078	2026-09-03 08:42:47.564078	\N
usr_1785320832989_7ynxq	FqBMMexpBsfME8R5sScmW0BRwxo1	dev@schoolerp.com	Developer Admin	dev	SUPER	SchoolERP Platform	school		f	t							{}	[]	2026-07-29 10:27:12.99	2026-07-29 10:27:12.99	\N
usr_1787065738241_jvb31	HIE3PjugTbNopiu9bVf4wel0ibx1	safwancoding1919@gmail.com	Mohammed Safwan	admin	TST001	Test School	school		f	t						Admin	{"departments": [], "academicYears": []}	["Manage Students", "Manage Teachers", "Attendance", "Institution Settings"]	2026-08-18 15:08:58.241	2026-08-18 15:16:30.167	\N
usr_1788405363222_lhyvtz	firebase_usr_1788405363222_lhyvtz	kavya.student@schoolerp.test	Kavya Iyer	student	TST001	Test School	school	C6A-005	f	t							{"section": "A", "department": "Class 6", "academicYear": "A", "classSectionId": "cs_1788379055324_gux95b", "classSectionName": "Class 6 A"}	[]	2026-09-03 08:46:03.223846	2026-09-03 08:46:03.223846	\N
usr_1788405363231_ubswfh	firebase_usr_1788405363231_ubswfh	saanvi.student@schoolerp.test	Saanvi Nair	student	TST001	Test School	school	C6A-009	f	t							{"section": "A", "department": "Class 6", "academicYear": "A", "classSectionId": "cs_1788379055324_gux95b", "classSectionName": "Class 6 A"}	[]	2026-09-03 08:46:03.232332	2026-09-03 08:46:03.232332	\N
usr_1788405167547_a4rct7	firebase_usr_1788405167547_a4rct7	anita.teacher@schoolerp.test	Ms Anita	teacher	TST001	Test School	school		t	f							{}	[]	2026-09-03 08:42:47.55252	2026-09-03 08:42:47.55252	\N
usr_1788516834596_m57zh	DBx7zPa2E9ahU95HK2rVHrdKaIA2	safwan.parent@gmail.com	Haneef (Parent of Safwan)	parent	TST001	Test School	school		f	t		7892104273					{"relation": "Father", "studentIds": ["usr_1788361696558_4x5g"], "studentNames": ["Safwan Haneef"], "linkedStudentUSN": "C6A-001"}	[]	2026-09-04 15:43:54.600676	2026-09-04 15:43:54.600676	\N
usr_1788361696558_4x5g	9mVRCcpLIGbJpkkpLbAk2woLTXG2	safwanhaneef786@gmail.com	Safwan Haneef	student	TST001	Test School	school	C6A-001	f	t	7892104273	7892104273					{"section": "A", "department": "Class 6", "academicYear": "A", "classSectionId": "cs_1788379055324_gux95b", "classSectionName": "Class 6 A"}	[]	2026-09-02 20:38:16.657733	2026-09-03 03:27:27.660884	\N
usr_1787066287949_dsdty	wkKueoJj8KRrbw97JT6Ytg9xbkV2	kadar@gmail.com	Mr Kadar	teacher	TST001	Test School	school		f	t						Senior Teacher	{"department": "Grade 6", "employeeId": "EMP-001", "experience": "8", "qualification": "M.Sc Mathematics"}	[]	2026-08-18 15:18:07.949	2026-08-18 15:19:19.159	\N
usr_1788405363182_d7rnj8	firebase_usr_1788405363182_d7rnj8	aarav.student@schoolerp.test	Aarav Khan	student	TST001	Test School	school	C6A-002	f	t							{"section": "A", "department": "Class 6", "academicYear": "A", "classSectionId": "cs_1788379055324_gux95b", "classSectionName": "Class 6 A"}	[]	2026-09-03 08:46:03.184138	2026-09-03 08:46:03.184138	\N
usr_1788405363217_tj8o9z	firebase_usr_1788405363217_tj8o9z	diya.student@schoolerp.test	Diya Sharma	student	TST001	Test School	school	C6A-003	f	t							{"section": "A", "department": "Class 6", "academicYear": "A", "classSectionId": "cs_1788379055324_gux95b", "classSectionName": "Class 6 A"}	[]	2026-09-03 08:46:03.218698	2026-09-03 08:46:03.218698	\N
usr_1788405363220_sok6dj	firebase_usr_1788405363220_sok6dj	ishaan.student@schoolerp.test	Ishaan Verma	student	TST001	Test School	school	C6A-004	f	t							{"section": "A", "department": "Class 6", "academicYear": "A", "classSectionId": "cs_1788379055324_gux95b", "classSectionName": "Class 6 A"}	[]	2026-09-03 08:46:03.221433	2026-09-03 08:46:03.221433	\N
usr_1788405363224_3e7k3h	firebase_usr_1788405363224_3e7k3h	manav.student@schoolerp.test	Manav Joshi	student	TST001	Test School	school	C6A-006	f	t							{"section": "A", "department": "Class 6", "academicYear": "A", "classSectionId": "cs_1788379055324_gux95b", "classSectionName": "Class 6 A"}	[]	2026-09-03 08:46:03.226119	2026-09-03 08:46:03.226119	\N
usr_1788405363227_24ccwl	firebase_usr_1788405363227_24ccwl	neha.student@schoolerp.test	Neha Reddy	student	TST001	Test School	school	C6A-007	f	t							{"section": "A", "department": "Class 6", "academicYear": "A", "classSectionId": "cs_1788379055324_gux95b", "classSectionName": "Class 6 A"}	[]	2026-09-03 08:46:03.228225	2026-09-03 08:46:03.228225	\N
usr_1788405363229_c4a1z0	firebase_usr_1788405363229_c4a1z0	rohit.student@schoolerp.test	Rohit Patel	student	TST001	Test School	school	C6A-008	f	t							{"section": "A", "department": "Class 6", "academicYear": "A", "classSectionId": "cs_1788379055324_gux95b", "classSectionName": "Class 6 A"}	[]	2026-09-03 08:46:03.230251	2026-09-03 08:46:03.230251	\N
usr_1788405363233_jmtosk	firebase_usr_1788405363233_jmtosk	vivaan.student@schoolerp.test	Vivaan Mehta	student	TST001	Test School	school	C6A-010	f	t							{"section": "A", "department": "Class 6", "academicYear": "A", "classSectionId": "cs_1788379055324_gux95b", "classSectionName": "Class 6 A"}	[]	2026-09-03 08:46:03.234417	2026-09-03 08:46:03.234417	\N
usr_1789459932511_hngj41	parent_1789459932511_9lcfft	parent.aarav@schoolerp.test	Parent of Aarav Khan	parent	TST001	Test School	school		f	t	+91-9876500010						"{\\"relation\\":\\"Parent\\",\\"studentIds\\":[\\"usr_1788405363182_d7rnj8\\"],\\"studentNames\\":[\\"Aarav Khan\\"],\\"linkedStudentUSN\\":\\"C6A-002\\"}"	[]	2026-09-15 08:12:12.511	2026-09-15 08:12:12.511	\N
usr_1789459932518_nru8x3	parent_1789459932518_zpkt6g	parent.diya@schoolerp.test	Parent of Diya Sharma	parent	TST001	Test School	school		f	t	+91-9876500011						"{\\"relation\\":\\"Parent\\",\\"studentIds\\":[\\"usr_1788405363217_tj8o9z\\"],\\"studentNames\\":[\\"Diya Sharma\\"],\\"linkedStudentUSN\\":\\"C6A-003\\"}"	[]	2026-09-15 08:12:12.518	2026-09-15 08:12:12.518	\N
usr_1789459932522_6yba63	parent_1789459932522_bn8dj0	parent.ishaan@schoolerp.test	Parent of Ishaan Verma	parent	TST001	Test School	school		f	t	+91-9876500012						"{\\"relation\\":\\"Parent\\",\\"studentIds\\":[\\"usr_1788405363220_sok6dj\\"],\\"studentNames\\":[\\"Ishaan Verma\\"],\\"linkedStudentUSN\\":\\"C6A-004\\"}"	[]	2026-09-15 08:12:12.522	2026-09-15 08:12:12.522	\N
usr_1789459932527_it3ubq	parent_1789459932527_pbcz8m	parent.kavya@schoolerp.test	Parent of Kavya Iyer	parent	TST001	Test School	school		f	t	+91-9876500013						"{\\"relation\\":\\"Parent\\",\\"studentIds\\":[\\"usr_1788405363222_lhyvtz\\"],\\"studentNames\\":[\\"Kavya Iyer\\"],\\"linkedStudentUSN\\":\\"C6A-005\\"}"	[]	2026-09-15 08:12:12.527	2026-09-15 08:12:12.527	\N
usr_1789459932531_u93s5m	parent_1789459932531_dpfggm	parent.manav@schoolerp.test	Parent of Manav Joshi	parent	TST001	Test School	school		f	t	+91-9876500014						"{\\"relation\\":\\"Parent\\",\\"studentIds\\":[\\"usr_1788405363224_3e7k3h\\"],\\"studentNames\\":[\\"Manav Joshi\\"],\\"linkedStudentUSN\\":\\"C6A-006\\"}"	[]	2026-09-15 08:12:12.531	2026-09-15 08:12:12.531	\N
usr_1789459932535_vgwrw1	parent_1789459932535_oxow6y	parent.neha@schoolerp.test	Parent of Neha Reddy	parent	TST001	Test School	school		f	t	+91-9876500015						"{\\"relation\\":\\"Parent\\",\\"studentIds\\":[\\"usr_1788405363227_24ccwl\\"],\\"studentNames\\":[\\"Neha Reddy\\"],\\"linkedStudentUSN\\":\\"C6A-007\\"}"	[]	2026-09-15 08:12:12.535	2026-09-15 08:12:12.535	\N
usr_1789459932540_r0jwce	parent_1789459932540_rxgeuh	parent.rohit@schoolerp.test	Parent of Rohit Patel	parent	TST001	Test School	school		f	t	+91-9876500016						"{\\"relation\\":\\"Parent\\",\\"studentIds\\":[\\"usr_1788405363229_c4a1z0\\"],\\"studentNames\\":[\\"Rohit Patel\\"],\\"linkedStudentUSN\\":\\"C6A-008\\"}"	[]	2026-09-15 08:12:12.54	2026-09-15 08:12:12.54	\N
usr_1789459932545_c881y7	parent_1789459932545_gfgh4n	parent.saanvi@schoolerp.test	Parent of Saanvi Nair	parent	TST001	Test School	school		f	t	+91-9876500017						"{\\"relation\\":\\"Parent\\",\\"studentIds\\":[\\"usr_1788405363231_ubswfh\\"],\\"studentNames\\":[\\"Saanvi Nair\\"],\\"linkedStudentUSN\\":\\"C6A-009\\"}"	[]	2026-09-15 08:12:12.545	2026-09-15 08:12:12.545	\N
usr_1789459932550_538b1d	parent_1789459932550_yhwh94	parent.vivaan@schoolerp.test	Parent of Vivaan Mehta	parent	TST001	Test School	school		f	t	+91-9876500018						"{\\"relation\\":\\"Parent\\",\\"studentIds\\":[\\"usr_1788405363233_jmtosk\\"],\\"studentNames\\":[\\"Vivaan Mehta\\"],\\"linkedStudentUSN\\":\\"C6A-010\\"}"	[]	2026-09-15 08:12:12.55	2026-09-15 08:12:12.55	\N
usr_1789575043616_kjywm	KeihSLwjTaSnOjcYcFnRIqoO9qB3	librarian@school.com	Main Librarian	librarian	default	SchoolHub Academy	school		f	f							{}	[]	2026-09-16 16:10:43.616	2026-09-16 16:10:43.616	\N
\.


--
-- Name: attendance_entries attendance_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_entries
    ADD CONSTRAINT attendance_entries_pkey PRIMARY KEY (id);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- Name: class_sections class_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_sections
    ADD CONSTRAINT class_sections_pkey PRIMARY KEY (id);


--
-- Name: exam_subjects exam_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_subjects
    ADD CONSTRAINT exam_subjects_pkey PRIMARY KEY (id);


--
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- Name: fee_payments fee_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_payments
    ADD CONSTRAINT fee_payments_pkey PRIMARY KEY (id);


--
-- Name: fee_structures fee_structures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fee_structures
    ADD CONSTRAINT fee_structures_pkey PRIMARY KEY (id);


--
-- Name: homework homework_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.homework
    ADD CONSTRAINT homework_pkey PRIMARY KEY (id);


--
-- Name: institutions institutions_institution_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_institution_code_unique UNIQUE (institution_code);


--
-- Name: institutions institutions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutions
    ADD CONSTRAINT institutions_pkey PRIMARY KEY (id);


--
-- Name: marks marks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marks
    ADD CONSTRAINT marks_pkey PRIMARY KEY (id);


--
-- Name: periods periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periods
    ADD CONSTRAINT periods_pkey PRIMARY KEY (id);


--
-- Name: student_classes student_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_classes
    ADD CONSTRAINT student_classes_pkey PRIMARY KEY (id);


--
-- Name: student_documents student_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_documents
    ADD CONSTRAINT student_documents_pkey PRIMARY KEY (id);


--
-- Name: subject_teachers subject_teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subject_teachers
    ADD CONSTRAINT subject_teachers_pkey PRIMARY KEY (id);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: timetable_slots timetable_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timetable_slots
    ADD CONSTRAINT timetable_slots_pkey PRIMARY KEY (id);


--
-- Name: timetables timetables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timetables
    ADD CONSTRAINT timetables_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_firebase_uid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_firebase_uid_unique UNIQUE (firebase_uid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_attendance_entries_record; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_entries_record ON public.attendance_entries USING btree (attendance_record_id);


--
-- Name: idx_attendance_entries_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_entries_student ON public.attendance_entries USING btree (student_id);


--
-- Name: idx_attendance_records_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_records_date ON public.attendance_records USING btree (date);


--
-- Name: idx_attendance_records_inst; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_records_inst ON public.attendance_records USING btree (institution_code);


--
-- Name: idx_attendance_records_slot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_records_slot ON public.attendance_records USING btree (timetable_slot_id);


--
-- Name: idx_attendance_records_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_records_teacher ON public.attendance_records USING btree (taken_by_teacher_id);


--
-- Name: idx_class_sections_inst; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_sections_inst ON public.class_sections USING btree (institution_code);


--
-- Name: idx_class_sections_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_sections_teacher ON public.class_sections USING btree (class_teacher_id);


--
-- Name: idx_exam_subjects_exam; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_subjects_exam ON public.exam_subjects USING btree (exam_id);


--
-- Name: idx_exams_inst; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exams_inst ON public.exams USING btree (institution_code);


--
-- Name: idx_exams_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exams_status ON public.exams USING btree (status);


--
-- Name: idx_fee_payments_fee_structure; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_payments_fee_structure ON public.fee_payments USING btree (fee_structure_id);


--
-- Name: idx_fee_payments_inst; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_payments_inst ON public.fee_payments USING btree (institution_code);


--
-- Name: idx_fee_payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_payments_status ON public.fee_payments USING btree (status);


--
-- Name: idx_fee_payments_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_payments_student ON public.fee_payments USING btree (student_id);


--
-- Name: idx_fee_structures_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_structures_category ON public.fee_structures USING btree (category);


--
-- Name: idx_fee_structures_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_structures_class ON public.fee_structures USING btree (class_section_id);


--
-- Name: idx_fee_structures_inst; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fee_structures_inst ON public.fee_structures USING btree (institution_code);


--
-- Name: idx_homework_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_homework_class ON public.homework USING btree (class_section_id);


--
-- Name: idx_homework_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_homework_due_date ON public.homework USING btree (due_date);


--
-- Name: idx_homework_inst; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_homework_inst ON public.homework USING btree (institution_code);


--
-- Name: idx_homework_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_homework_subject ON public.homework USING btree (subject_id);


--
-- Name: idx_homework_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_homework_teacher ON public.homework USING btree (teacher_id);


--
-- Name: idx_marks_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marks_class ON public.marks USING btree (class_section_id);


--
-- Name: idx_marks_exam; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marks_exam ON public.marks USING btree (exam_id);


--
-- Name: idx_marks_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_marks_student ON public.marks USING btree (student_id);


--
-- Name: idx_periods_inst; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_periods_inst ON public.periods USING btree (institution_code);


--
-- Name: idx_student_classes_active_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_classes_active_student ON public.student_classes USING btree (student_id, is_active);


--
-- Name: idx_student_classes_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_classes_class ON public.student_classes USING btree (class_section_id);


--
-- Name: idx_student_classes_inst; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_classes_inst ON public.student_classes USING btree (institution_code);


--
-- Name: idx_student_classes_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_classes_student ON public.student_classes USING btree (student_id);


--
-- Name: idx_student_documents_inst; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_documents_inst ON public.student_documents USING btree (institution_code);


--
-- Name: idx_student_documents_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_documents_student ON public.student_documents USING btree (student_id);


--
-- Name: idx_subject_teachers_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subject_teachers_class ON public.subject_teachers USING btree (class_section_id);


--
-- Name: idx_subject_teachers_inst; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subject_teachers_inst ON public.subject_teachers USING btree (institution_code);


--
-- Name: idx_subject_teachers_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subject_teachers_teacher ON public.subject_teachers USING btree (teacher_id);


--
-- Name: idx_subjects_inst; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subjects_inst ON public.subjects USING btree (institution_code);


--
-- Name: idx_timetable_slots_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_timetable_slots_class ON public.timetable_slots USING btree (class_section_id);


--
-- Name: idx_timetable_slots_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_timetable_slots_teacher ON public.timetable_slots USING btree (teacher_id);


--
-- Name: idx_timetable_slots_tt; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_timetable_slots_tt ON public.timetable_slots USING btree (timetable_id);


--
-- Name: idx_timetables_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_timetables_class ON public.timetables USING btree (class_section_id);


--
-- Name: idx_timetables_inst; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_timetables_inst ON public.timetables USING btree (institution_code);


--
-- Name: idx_users_institution_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_institution_code ON public.users USING btree (institution_code);


--
-- Name: uq_attendance_entries_record_student; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_attendance_entries_record_student ON public.attendance_entries USING btree (attendance_record_id, student_id);


--
-- Name: uq_attendance_records_slot_date; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_attendance_records_slot_date ON public.attendance_records USING btree (timetable_slot_id, date);


--
-- Name: uq_class_sections_inst_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_class_sections_inst_name ON public.class_sections USING btree (institution_code, name);


--
-- Name: uq_exam_subjects_exam_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_exam_subjects_exam_subject ON public.exam_subjects USING btree (exam_id, subject_id);


--
-- Name: uq_marks_exam_subject_student; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_marks_exam_subject_student ON public.marks USING btree (exam_subject_id, student_id);


--
-- Name: uq_student_classes_class_student_year; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_student_classes_class_student_year ON public.student_classes USING btree (class_section_id, student_id, academic_year);


--
-- Name: uq_subject_teachers_class_subject; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_subject_teachers_class_subject ON public.subject_teachers USING btree (class_section_id, subject_id);


--
-- Name: uq_subjects_inst_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_subjects_inst_name ON public.subjects USING btree (institution_code, name);


--
-- Name: uq_timetable_slots_tt_day_period; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_timetable_slots_tt_day_period ON public.timetable_slots USING btree (timetable_id, day_of_week, period_id);


--
-- Name: uq_timetables_class_version; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_timetables_class_version ON public.timetables USING btree (class_section_id, version);


--
-- PostgreSQL database dump complete
--

\unrestrict W3ppszVc7mZ2XZqIqVaLfsuxY2zg99vOHN3uL643nMeLS7NG5YiVfSFX2h83LtX

