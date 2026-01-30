-- Fix friend_privacy_settings exposure: restrict SELECT to owner & friends only

drop policy if exists "Users can view privacy settings" on public.friend_privacy_settings;

create policy "Users can view their own privacy settings"
on public.friend_privacy_settings
for select
using (auth.uid() = user_id);

create policy "Users can view privacy settings of friends"
on public.friend_privacy_settings
for select
using (
  exists (
    select 1
    from public.friend_connections fc
    where fc.status = 'accepted'::public.friend_status
      and (
        (fc.requester_id = auth.uid() and fc.addressee_id = friend_privacy_settings.user_id)
        or
        (fc.addressee_id = auth.uid() and fc.requester_id = friend_privacy_settings.user_id)
      )
  )
);