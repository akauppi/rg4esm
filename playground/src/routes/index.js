<!--
- Redirect to first page
-->
export async function load() {
  return {
    status: 301,
    redirect: `/dispatch`,
  }
}
